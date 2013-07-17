#!/usr/bin/env node

var fs         = require('fs')
var path       = require('path')

var autonode   = require('autonode')
var multilevel = require('multilevel')
var levelup    = require('level')
var sublevel   = require('level-sublevel')
var Manifest   = require('level-manifest')
var npmconf    = require('npmconf')

var getConf    = require('./config')
var commands   = require('./options')

var manifest   = require('./manifest.json')

//pull npmconf, so know where to install global modules.
npmconf.load({}, function (err, conf) {

  var config = getConf(conf)

  var db

  function createDb (db) {
    if(!db) db = sublevel(levelup(config.path, config))
    return db
  }

  var plugins = [
    require('./plugins/couch-sync'),
    require('./plugins/inverted-index'),
    require('./plugins/authors'),
    require('npmd-resolve'),
    require('npmd-tree'),
    require('npmd-link'),
    require('npmd-install')(config),
    require('./plugins/versions'),
    require('./plugins/packages'),
    {commands: function (db) {
      db.commands.push(function (db, config, cb) {
          fs.createReadStream(__dirname + '/README.md')
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
        cli(db, config)
    })
  }

  function addDb (db, config) {
    db.config = config
    plugins.forEach(function (e) {
      if('function' === typeof e.db)
        e.db(db, config)
    })
  }

  //TODO: make a middleware like thing but with
  //cli commands.

  function execCommands (db, config, cb) {
    if(!commands(db.commands) (db, config, cb))
      cb(new Error('unknown command'))
  }

  server = autonode(function (stream) {
    var dbStream = this.isServer
      ? multilevel.server(db)
      : multilevel.client(manifest)

    stream.pipe(dbStream).pipe(stream)
    stream.on('error', function () {console.error('disconnected')})
  
    if(this.isClient) {
      //process commands.
      addCommands(dbStream)
      execCommands(dbStream, config, function (err) {
        if(err) throw err
        server.close(); stream.end()
      })
    }
  })
  .listen(config.port)
  .on('listening', function () {
    db = createDb()

    //attach all plugins.
    //process any commands.
    addDb(db, config)
    addCommands(db, config)

    var manifest = Manifest(db, true)

    if(config.manifest)
      fs.writeFileSync(
        __dirname+'/manifest.json',
        JSON.stringify(manifest, null, 2)
      )

    execCommands(db, config, function (err, data) {
      if(err) throw err
      process.exit()
    })
  })
})
