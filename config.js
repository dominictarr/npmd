var path     = require('path')
var rc       = require('rc')
var optimist = require('optimist')
var toCC     = require('to-camel-case')
var osenv    = require('osenv')

var home     = osenv.home()
var tmp      = osenv.tmpdir()

module.exports = (function () {
  // *** vvv Copied this stuff out of npmconf **********************
  var uidOrPid = process.getuid ? process.getuid() : process.pid

  if (home) process.env.HOME = home
  else home = path.resolve(temp, "npm-" + uidOrPid)

  var cacheExtra = process.platform === "win32" ? "npm-cache" : ".npm"
  var cacheRoot = process.platform === "win32" && process.env.APPDATA || home
  var cache = path.resolve(cacheRoot, cacheExtra)
  // *** ^^^ Copied this stuff out of npmconf **********************

  var config = rc('npmd', {
    dbPath: path.join(process.env.HOME, '.npmd'),
    debug: true,
    sync: false,
    encoding: 'json',
    registry: 'http://isaacs.iriscouch.com/registry',
    cache: cache,
    "user-agent" : "node/" + process.version
                 + ' ' + process.platform
                 + ' ' + process.arch,
    prefix: (
      process.env.PREFIX ||
      ( process.platform === 'win32' ? path.dirname(process.execPath)
      : path.dirname(path.dirname(process.execPath)))
    ),
    port: 5656
  },
  optimist
    .alias('g', 'global')
    .alias('f', 'force')
    .alias('D', 'saveDev')
    .alias('S', 'save')
    .boolean('global')
    .boolean('online')
    .boolean('offline')
    .boolean('save-dev')
    .boolean('saveDev')
    .boolean('save-peer')
    .boolean('savePeer')
    .boolean('save')
    .argv
  )

  config.bin = config.bin ||
  ( config.global ? path.join(config.prefix, 'bin')
  : path.join(config.path || process.cwd(), 'node_modules', '.bin'))

  if(!config.path && config.global)
    config.path = config.prefix

  for(var k in config)
    config[toCC(k)] = config[k]

  if(config.showConfig)
    console.log(JSON.stringify(config, null, 2))

  return config
})()

