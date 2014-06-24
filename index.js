#!/usr/bin/env node

var fs         = require('fs')
var path       = require('path')
var mkdirp     = require('mkdirp')

//var autonode   = require('autonode')
//var multilevel = require('multilevel')

var levelup    = require('levelup')

//var levelup    = require('level')
//var sublevel   = require('level-sublevel')
//var Manifest   = require('level-manifest')

var config     = require('npmd-config')
var commands   = require('./options')
var createCache = require('npmd-cache')

//var manifest   = require('./manifest.json')

if(config.version) {
  console.log(require('./package').version)
  process.exit()
}

var leveldown = require('leveldown')

var db, cache

function createDb (cb) {
  levelup(
    path.join(config.dbPath, config.jsdb ? 'jsdb' : 'db'),
    {encoding: 'json', db: leveldown},
    function (err, db) {
      if(err && /No such file or directory/.test(err.message))
        return mkdirp(config.dbPath, function (err) {
          if(err) return cb(err)
          createDb(cb)
        })
      if(err) return cb(err)
      db.methods = {}
      cache = createCache(db, config)
      cb(null, db)
    }
  )
}

  var plugins = [
//    require('./plugins/couch-sync'),
//    require('./plugins/inverted-index'),
//    require('./plugins/publish'),
//    require('./plugins/authors'),
    require('./plugins/resolve'),
    require('./plugins/tree'),
//    require('./plugins/leaves'),
//    require('./plugins/link'),
    require('./plugins/install'),
//    require('./plugins/versions'),
//    require('./plugins/packages'),
//    require('./plugins/readme'),
//    require('./plugins/dependents'),
    require('./plugins/help'),
//    require('./plugins/add'),
    require('./plugins/build'),
//    require('./plugins/show'),
    {commands: function (db) {
      db.commands.push(function (db, cache, config, cb) {
          fs.createReadStream(__dirname + '/docs/usage.md')
          .on('close', function () {
            cb()
          })
          .pipe(process.stdout)
        return true
        })
      }
    }
  ]

  function addCommands(db) {
    db.cli = db.commands = []
    plugins.forEach(function (plug) {
      var cli = plug.cli || plug.commands
      if('function' === typeof cli)
        cli(db, cache, config)
    })
  }

  function addDb (db, cache, config) {
    db.config = config
    plugins.forEach(function (e) {
      if('function' === typeof e.db)
        e.db(db, cache, config)
    })
  }

  //TODO: make a middleware like thing but with
  //cli commands.

  function execCommands (db, config, cb) {
    if(!commands(db.commands) (db, cache, config, cb))
      cb(new Error('unknown command'))
  }

//  server = autonode(function (stream) {
//    var dbStream = this.isServer
//      ? multilevel.server(db)
//      : multilevel.client(manifest)
//
//    stream.on('error', function (e) {
//      console.error(e.stack)
//      stream.end()
//    })
//
//    dbStream.on('error', function (e) {
//      console.error(e.stack)
//      stream.end()
//    })
//
//    stream.pipe(dbStream).pipe(stream)
//  
//    if(this.isClient) {
//      //process commands.
//      addCommands(dbStream)
//      execCommands(dbStream, config, function (err) {
//        if(err) throw err
//        server.close(); stream.end()
//      })
//    }
//  })
//  .listen(config.port)
//  .on('listening', function () {
    createDb(function(err, db){
      if(err) throw err

      //attach all plugins.
      //process any commands.
      addDb(db, cache, config)
      addCommands(db, cache, config)

//    var manifest = Manifest(db, true)

//    if(config.manifest) {
//      fs.writeFileSync(
//        __dirname+'/manifest.json',
//        JSON.stringify(manifest, null, 2)
//      )
//      console.log('updated manifest.json')
//      process.exit(0)
//    }

      execCommands(db, config, function (err, data) {
        if(err) throw err
        console.log(JSON.stringify(data, null, 2))
        process.exit()
      })
//  })

    })

