
var shoe       = require('shoe')
var ecstatic   = require('ecstatic')
var http       = require('http')
var multilevel = require('multilevel')
var manifest   = require('level-manifest')
var fs         = require('fs')
var path       = require('path')

var db         = require('./')(path.join(process.env.HOME, '.npmd'))

fs.writeFileSync('./manifest.json', JSON.stringify(manifest(db, true), null, 2))

shoe(function (stream) {
  console.log('connect')
  stream.pipe(multilevel.server(db)).pipe(stream)

  stream.on('data', console.log)
  db.on('data', console.log)
})
.install(
  http.createServer(ecstatic(__dirname + '/static'))
  .listen(4930),
  {prefix: '/multilevel'}
)

