var path = require('path')

var rc = require('rc')

module.exports = function (npmconf) {
  return rc('npmd', {
    dbPath: path.join(process.env.HOME, '.npmd'),
    debug: true,
    sync: false,
    encoding: 'json',
    registry: 'http://isaacs.iriscouch.com/registry',
//    registry: npmconf.get('registry'),
    cache: npmconf.get('cache'),
    prefix: npmconf.get('prefix'),
    port: 5656
  })
}

