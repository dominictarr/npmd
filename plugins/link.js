var link = require('npmd-link')
exports.commands = function (db) {
  var start = Date.now()
  db.commands.push(function (db, config, cb) {
    var args = config._.slice()
    var cmd = args.shift()

    if('link' !== cmd) return

    db.leaves(args, config, function (err, tree) {
      if(err) return cb(err)
      link(tree, config, cb)
    })

    return true
  })
}

