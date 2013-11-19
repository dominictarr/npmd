var deps = require('get-deps')

exports.commands = function (db, config) {

  var install = require('npmd-install')
  db.commands.push(function (db, config, cb) {
    var args = config._.slice()
    if('install' !== args.shift()) return

    db.resolve(args, config, function (err, tree) {
      if(err) return cb(err)
      install(tree, config, cb)
    })
    return true
  })
}

