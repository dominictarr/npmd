var tree = require('npmd-tree')

exports.cli = function (db) {
  db.commands.push(function (db, cache, config, cb) {
    var args = config._.slice()
    var cmd = args.shift()
  
    if(cmd == 'tree') {
      tree.tree(config.installPath, config, function (err, tree) {
        if(err) throw err
        console.log(JSON.stringify(tree, null, 2))
        cb()
      })
    }
    else if(cmd == 'ls')
      tree.ls(config.installPath, function (err, tree) {
        if(err) throw err
        console.log(JSON.stringify(tree, null, 2))
        cb()
      })
    else
      return

    return true
  })
}

