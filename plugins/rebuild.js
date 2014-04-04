
var rebuild = require('npmd-rebuild')

exports.commands = function (db, cache, config) {

  db.commands.push(function (db, cache, config, cb) {

    if(config._[0] !== 'rebuild') return

    rebuild(config._[0], config, cb)

    return true

  })

}
