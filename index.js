#!/usr/bin/env node

var fs         = require('fs')
var autonode   = require('autonode')
var multilevel = require('multilevel')
var levelup    = require('level')
var sublevel   = require('level-sublevel')

var path       = require('path')

//memwatch.on('stats', console.error)

var config = require('./config')

function createDb (db) {
  if(!db) db = sublevel(levelup(config.path, config))
  return db
}

var Manifest = require('level-manifest')

var db, manifest = require('./manifest.json')

var config = require('./config')

var plugins = [
  require('./plugins/couch-sync'),
  require('./plugins/inverted-index'),
  require('./plugins/authors')
]

function addDb (db, config) {
  db.config = config
  db.commands = db.commands || {}
  plugins.forEach(function (e) {
    if('function' === typeof e)
      e(db, config)
    else if('function' === typeof e.db)
      e.db(db, config)
  })

  plugins.forEach(function (e) {
    if(e.commands)
      e.commands(db)
  })
}

function addCommands(db) {
  db.commands = {}
  plugins.forEach(function (e) {
    if(e.commands)
      e.commands(db)
  })
}

function execCommands (db, config) {
  if(!config._.length)
    return

  var command = config._.shift()

  if(db.commands[command])
    db.commands[command](config, function (err) {
      if(err) throw err
      server.close()
    })
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
    execCommands(dbStream, config)
  }

})
.listen(config.port)
.on('listening', function () {
  db = createDb()
  //attach all plugins.
  //process any commands.
  addDb(db, config)

  var manifest = Manifest(db, true)
  fs.writeFileSync(
    __dirname+'/manifest.json',
    JSON.stringify(manifest, null, 2)
  )

  addCommands(db)
  execCommands(db, config)
})

