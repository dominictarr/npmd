var semver = require('semver')
var pl = require('pull-level')
var pull = require('pull-stream')

exports.commands = function (db, config) {
  db.commands.push(function (db, config, cb) {
    var args = config._.slice()
    if(args.shift() !== 'show') return
    
    var moduleVer = args.shift()
    var parts = moduleVer.split('@')
    var module = parts.shift() || moduleVer
    var version = parts.shift() || '*'

    if(!module) {
      console.log('expects a module@version'); cb()
      return true
    }

    pull(
      pl.read(db.sublevel('ver'), {min: module+'!', max: module + '!~'}),
      pull.map(function (d) { return d.value }),
      pull.filter(function (pkg) {
        return semver.satisfies(pkg.version, version, true)
      }),
      pull.collect(function (err, array) {
        if(array) {
          if(semver.valid(version) && array.length == 1)
            array = array.shift()
          console.log(JSON.stringify(array, null, 2))
        }
        cb(err, array)
      })
    )

    return true
  })
}
