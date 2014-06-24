
var build = require('npmd-build')

exports.commands = function (db, cache, config) {

  db.commands.push(function (db, cache, config, cb) {

    if(config._[0] !== 'build' && config._[0] !== 'rebuild') return

    build(config._[0], config, cb)

    return true

  })

}
