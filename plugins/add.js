var addDeps = require('add-deps')

exports.cli = function (db) {

  db.commands.push(function (db, config, cb) {
    var args = config._.slice()
    if(args.shift() !== 'add') return
    addDeps(process.cwd(), args, config, cb)
    return true
  })

}
