var path    = require('path')
var ls      = require('npmd-tree').ls
var createResolve = require('npmd-resolve')
var deps    = require('get-deps')

exports.db = function (db, config) {
  var resolve = createResolve(db.sublevel('ver'), config)
  db.methods.resolve = {type: 'async'}
  db.resolve = function (module, opts, cb) {
    if(!cb) cb = opts, opts = {}
    if(opts.hash) opts.greedy = false

    if(!module || !module.length)
      module = deps(process.cwd(), config)

    ls(function (err, tree) {
      if(err) return cb(err)
      resolve(module,
          merge({
            greedy: opts.greedy,
            available: tree
          }, config),
        cb
      )
    })
  }
}

function merge (a, b) {
  for(var k in b)
    if(!a[k])
      a[k] = b[k]
  return a
}

exports.cli = function (db) {
  db.commands.push(function (db, config, cb) {
    var args = config._.slice()
    var cmd = args.shift()
    
    if(cmd === 'resolve') {
      db.resolve(args, config,
        function (err, tree) {
          if(err) return cb(err)
          console.log(JSON.stringify(tree, null, 2))
          cb(null, tree)
      })
  
      return true
    }

  })
}

