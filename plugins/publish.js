var spawn = require('child_process').spawn
var exec = require('child_process').exec
var pad = require('padded-semver').pad
var unpad = require('padded-semver').unpad

var fs = require('fs')
var path = require('path')
var crypto = require('crypto')

function pkgRoot (dir, cb) {
  if (dir === '') return cb(new Error('not in a package directory'))

  fs.exists(path.join(dir, 'package.json'), function (ex) {
    if (ex) cb(null, dir)
    else pkgRoot(dir.split('/').slice(0, -1), cb)
  })
}

function cachePackFile (pkg, cacheDir, cb) {
  var file = pkg.name + '-' + pkg.version + '.tgz'
  fs.unlink(file, cb)
}

function readPkg (dir, cb) {
  fs.readFile(path.join(dir, 'package.json'), function (err, src) {
    if (err) return cb(err)
    try { var pkg = JSON.parse(src) }
    catch (e) { return cb(e) }
    cb(null, pkg)
  })
}

function queuePublish (db, cacheDir, pkg, cb) {
  var key = pkg.name + '-' + pkg.version
  var tgz = path.join(cacheDir, pkg.name, pkg.version, 'package.tgz')
  var pkgdir = path.join(cacheDir, pkg.name, pkg.version, 'package')
  var gypfile = path.join(pkgdir, 'binding.gyp')
 
  var pending = 5
  exec('npm whoami', function (err, out) {
    // TODO: the other maintainers
    pkg.maintainers = out ? [ { name: String(out).trim() } ] : []
    done()
  })

  fs.exists(gypfile, function (ex) {
    pkg._gypfile = ex
    done()
  })
 
  fs.stat(tgz, function (err, stat) {
    pkg._tgzSize = stat.size
    done()
  })

  var hash = ''
  fs.createReadStream(tgz)
    .pipe(crypto.createHash('sha1', { encoding: 'hex' }))
    .on('data', function (s) { hash += s })
    .on('end', function () {
      pkg._tgzHash = hash
      done()
    })
 
  fs.readdir(pkgdir, function (err, files) {
    var readme = files.filter(function (file) {
      return /^readme(\.(md|markdown|txt))?$/i.test(file)
    }).sort()[0]
    fs.readFile(readme, 'utf8', function (err, src) {
      pkg.readme = String(src || '')
      done()
    })
  })

  function done () {
    if (--pending !== 0) return
    writeBatch(db, pkg, cb)
  }
}

function writeBatch (db, pkg, cb) {
  var now = new Date
  db.batch([
    {
      prefix: db.sublevel('queue').prefix(),
      type: 'put',
      key: pkg.name + '!' + pad(pkg.version),
      value: 0
    },
    {
      prefix: db.sublevel('pkg').prefix(),
      type: 'put',
      key: pkg.name,
      value: {
        name: pkg.name,
        description: pkg.description,
        readme: pkg.readme,
        keywords: pkg.keywords,
        author: pkg.author,
        licenses: pkg.licenses || pkg.license ? [ pkg.license ] : undefined,
        repository: pkg.repository,
        maintainers: pkg.maintainers
      }
    },
    {
      prefix: db.sublevel('ver').prefix(),
      type: 'put',
      key: pkg.name + '!' + pad(pkg.version),
      value: {
        name: pkg.name,
        version: pkg.version,
        dependencies: pkg.dependencies,
        devDependencies: pkg.devDependencies,
        description: pkg.description,
        size: pkg._tgzSize,
        time: {
          modified: now,
          created: now
        },
        shasum: pkg._tgzHash,
        gypfile: pkg._gypfile
      }
    }
  ], cb)
}

exports.db = function (db, config) {
  db.sublevel('queue')
}

exports.cli = function (db) {
  db.commands.push(function (db, config, cb) {
    var args = config._.slice()
    var cmd = args.shift()
    if (cmd === 'queue' && args[0] === 'rm') {
      var name = args[1].split('@')[0]
      var ver = args[1].split('@')[1]

      if (!ver) return cb(new Error('usage: npmd queue rm pkg@ver'))

      db.batch([
        {
          type: 'del',
          prefix: db.sublevel('queue').prefix(),
          key: name + '!' + pad(ver)
        },
        {
          type: 'del',
          prefix: db.sublevel('ver').prefix(),
          key: name + '!' + pad(ver)
        },
      ], cb)
      return true
    }
    else if (cmd === 'queue') {
      db.sublevel('queue').createKeyStream()
        .on('data', function (key) {
          var ver = unpad(key.replace(/^[^!]+!/, ''))
          var name = key.split('!')[0] + '@' + ver
          console.log(name)
        })
        .on('end', cb)
      return true
    }
    if (cmd !== 'publish') return
 
    pkgRoot(process.cwd(), function (err, dir) {
      if (err) return cb(err)
 
      var ps = spawn('npm', [ 'pack' ], { cwd: dir })
      ps.stderr.pipe(process.stderr)
      ps.stdout.pipe(process.stdout)
      
      ps.on('exit', function (code) { onPackExit(code, dir) })
    })

    function onPackExit (code, dir) {
      if (code !== 0) {
        return cb(new Error('non-zero exit code from `npm pack`'))
      }
      readPkg(dir, function (err, pkg) {
        if (err) cb(err)
        else cachePackFile(pkg, config.cache, function (err) {
          if (err) cb(err)
          else queuePublish(db, config.cache, pkg, cb)
        })
      })
    }
 
    return true
  })
 
}
