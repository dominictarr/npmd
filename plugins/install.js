var deps = require('get-deps')
var addDeps = require('add-deps')
var rebuild = require('npmd-rebuild')
var bin = require('npmd-bin')
var path = require('path')

exports.commands = function (db, config) {

  var install = require('npmd-install')
  db.commands.push(function (db, config, cb) {
    var args = config._.slice()
    if('install' !== args.shift()) return

    var _args = args.slice()

    db.resolve(args.slice(), config, function (err, tree) {
      if(err) return cb(err)
      install(tree, config, function (err, installed) {
        if(err) return cb(err)

        if(config.save || config.saveDev)
          addDeps(config.path || process.cwd(), installed, config, next)
        else next()

        function next () {
        
          rebuild(_args[0], config, function (err) {

            _args = _args.map(function (e) {
              e = e.split('@').shift()
              if(/^[./]/.test(e)) return e
              return config.global
                ? path.join(config.prefix, 'lib', 'node_modules', e)
                : path.join(process.cwd(), 'node_modules', e)
            })

            bin.all(_args, config.bin, config, cb)

          })

        }
      })

      //and then build, and link deps
    })
    return true
  })
}

