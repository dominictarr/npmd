
var leaves = require('npmd-leaves')

module.exports.db = function (db, config) {
  db.methods.leaves = {type: 'async'}
  db.leaves = function (module, opts, cb) {
    if(!cb)
      cb = opts, opts = {}

    opts.hash = true
    opts.check = false

    db.resolve(module, opts, function (err, tree) {
      if(err) cb(err)
      cb(err, leaves(tree), tree)
    })
  }
}


exports.commands = function (db, config, cb) {

  var start = Date.now()
  db.commands.push(function (db, config, cb) {
    var args = config._.slice()
    var cmd = args.shift()

    if('leaves' === cmd) {
      if(!args.length)
        args = deps(config.path || process.cwd(), config)
      db.leaves(args, config, function (err, tree, root) {
        if(err) return cb(err)
        console.log(JSON.stringify(tree, null, 2))
        cb(null, tree)
      })
      return true
    }

  })

}
