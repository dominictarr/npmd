#!/usr/bin/env node

var fs         = require('fs')
var path       = require('path')

var autonode   = require('autonode')
var multilevel = require('multilevel')
var levelup    = require('level')
var sublevel   = require('level-sublevel')
var Manifest   = require('level-manifest')

var config     = require('./config')
var manifest   = require('./manifest.json')
var config     = require('./config')

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
  require('npmd-install')
]

function addCommands(db) {
  db.commands = {}
  plugins.forEach(function (e) {
    if(e.commands)
      e.commands(db)
  })
}

function addDb (db, config) {
  db.config = config
  plugins.forEach(function (e) {
    if('function' === typeof e.db)
      e.db(db, config)
    else if('function' === typeof e)
      e(db, config)
  })
}

//TODO: make a middleware like thing but with
//cli commands.

function execCommands (db, config, cb) {
  var called = false
  if(!config._.length)
    return cb(null, false)

  var command = config._.shift()
  if(db.commands[command]) {
    called = true
    return db.commands[command](config, cb)
  }
  cb(null, false)
}

function printHelp () {
  fs.createReadStream(__dirname + '/README.md')
  .on('close', function () {
    process.exit()
  })
  .pipe(process.stdout)
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
    execCommands(dbStream, config, function (err, did) {
      if(err) throw err
      server.close(); stream.end()
      if(did === false)
        printHelp()
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

  fs.writeFileSync(
    __dirname+'/manifest.json',
    JSON.stringify(manifest, null, 2)
  )
  execCommands(db, config, function (err, data) {
    if(err) throw err
    if(!config.sync)
      printHelp(data)
  })
})

