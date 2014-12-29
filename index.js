#!/usr/bin/env node

'use strict'

var fs         = require('fs')
var path       = require('path')
var mkdirp     = require('mkdirp')

var levelup    = require('levelup')

var config     = require('npmd-config')
var commands   = require('./options')
var createCache = require('npmd-cache')

if(config.version) {
  console.log(require('./package').version)
  process.exit()
}

var medeadown = require('medeadown')

var db, cache

function createDb (cb) {
  levelup(
    path.join(config.dbPath, config.jsdb ? 'jsdb' : 'db'),
    {encoding: 'json', db: medeadown},
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
  require('./plugins/resolve'),
  require('./plugins/tree'),
  require('./plugins/install'),
  require('./plugins/help'),
  require('./plugins/build'),
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

createDb(function(err, db){
  if(err) throw err

  //attach all plugins.
  //process any commands.
  addDb(db, cache, config)
  addCommands(db, cache, config)

  execCommands(db, config, function (err, data) {
    if(err) throw err
    if(data)
      console.log(JSON.stringify(data, null, 2))
    process.exit()
  })
})

