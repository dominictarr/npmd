var spawn = require('child_process').spawn
var exec = require('child_process').exec
var pad = require('padded-semver').pad
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
    pkg.maintainers = out ? [ String(out).trim() ] : []
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
      prefix: db.sublevel('pub'),
      type: 'put',
      key: pkg.name + '@' + pkg.version,
      value: 0
    },
    {
      prefix: db.sublevel('pkg'),
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
      prefix: db.sublevel('ver'),
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

exports.cli = function (db) {
  db.commands.push(function (db, config, cb) {
    var args = config._.slice()
    var cmd = args.shift()
    if (cmd === 'publish-queue') {
      db.sublevel('pub').createKeyStream()
        .on('data', console.log.bind(console))
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
