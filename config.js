var path = require('path')

module.exports = require('rc')('npmd', {
  path: path.join(process.env.HOME, '.npmd'),
  debug: true,
  sync: false,
  encoding: 'json',
  registry: 'http://isaacs.iriscouch.com/registry',
  port: 5656
})

