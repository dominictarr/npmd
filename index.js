#!/usr/bin/env node

var levelCouchSync = require('level-couch-sync')
var pad = require('padded-semver').pad
var Inverted = require('level-inverted-index')
var MapReduce = require('map-reduce')

var opts = require('optimist').argv

var db = require('level-sublevel')(require('levelup')(process.env.HOME + '/.npmd'), '~')
var packageDb = db.sublevel('package')
var versionDb = db.sublevel('version')

levelCouchSync('http://isaacs.iriscouch.com/registry', db, 'registry-sync', 
  function (data, emit) {
    var doc = data.doc

    //don't allow keys with ~
    if(/~/.test(data.id)) return
    emit(data.id, JSON.stringify({
      name        : doc.name,
      description : doc.keywords,
      readme      : doc.readme,
      keywords    : doc.keywords,
      author      : doc.author,
      licenses    : doc.licenses,
      repository  : doc.repository
    }), packageDb)

    //versions
    var vers = doc.versions
    for(var version in vers) {
      var ver = vers[version]
      emit(data.id + '!!' + pad(version), JSON.stringify({
        name: ver.name,
        version: ver.version,
        dependencies: ver.dependencies,
        devDependencies: ver.devDependencies,
        description: ver.description
      }), versionDb)
    }
  })
  .on('progress', function (ratio) {
    console.log(Math.floor(ratio*10000)/100)
  })

var i = 0
var indexDb = 
Inverted(packageDb, 'index', function (key, value, index) {
  if(!(i++ % 100))
    console.log(key)
  value = JSON.parse(value)
  index(value.readme)
  index(value.name)
  index(value.author)
  index(value.keywords)
  index(value.description)
}, function (value, query) {
  value = JSON.parse(value)
  //todo query 
  return [
    '-----------------------------',
//    '## ' + value.name,
    (value.readme ? value.readme.substring(0, 140) + '...' : value.description || value.name)
    .split('\n').map(function (e) {
      return '  ' + e
    }).join('\n')
  ].join('\n')
})

//indexDb.start()

//how many authors? how many modules?

var authorsDb = MapReduce(packageDb, db.sublevel('authors'), function (key, value, emit) {
  value = JSON.parse(value)
  var author = value.author
  author = author && author.name || author
  console.log('author:', author, key)
  if('string' === typeof author)
    emit(author, 1)
}, function (acc, item) {
  return Number(acc || 0) + Number(item || 0)
})

var RepRed = require('level-repred')

var rr = RepRed(packageDb, function (data) {
  return {count: data.value ? 1 : -1}
},
function (acc, data, key) {
  acc.count += data.count
  return data
}, {count: 0})

rr.on('update', function (e) {
//  console.log('COUNT', e)
})

if(opts._.length) {
  if(opts.query)
    return indexDb.query(opts._)
      .on('data', console.log)

  indexDb.createQueryStream(opts._)
    .on('data', console.log)
}


if(opts.authors && opts.init) {
  authorsDb.start()
}

if(opts.authors) {
  authorsDb.createReadStream({range: [true], tail: true})
  .on('data', console.log)
}
