var spawn = require('child_process').spawn
var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')

function pkgRoot (dir, cb) {
  if (dir === '') return cb(new Error('not in a package directory'))

  fs.exists(path.join(dir, 'package.json'), function (ex) {
    if (ex) cb(null, dir)
    else pkgRoot(dir.split('/').slice(0, -1), cb)
  })
}

function cachePackFile (pkg, cacheDir, cb) {
  var file = pkg.name + '-' + pkg.version + '.tgz'
  fs.unlink(file, cb);
}

function readPkg (dir, cb) {
  fs.readFile(path.join(dir, 'package.json'), function (err, src) {
    if (err) return cb(err)
    try { var pkg = JSON.parse(src) }
    catch (e) { return cb(e) }
    cb(null, pkg)
  })
}

function queuePublish (db, pkg, cb) {
  var key = pkg.name + '-' + pkg.version
  db.put(pkg.name + '@' + pkg.version, 0, cb)
}

exports.cli = function (db) {
  db.commands.push(function (db, config, cb) {
    var args = config._.slice()
    var cmd = args.shift()
    if (cmd === 'publish-queue') {
      db.sublevel('publish-queue').createKeyStream()
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
          else queuePublish(db.sublevel('publish-queue'), pkg, cb)
        })
      })
    }
 
    return true
  })
 
}
