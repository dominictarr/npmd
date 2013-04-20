#!/usr/bin/env node

var levelCouchSync = require('level-couch-sync')
var pad = require('padded-semver').pad
var Inverted = require('level-inverted-index')
var MapReduce = require('map-reduce')

var opts = require('optimist').argv
var levelup = require('levelup')
var sublevel = require('level-sublevel')
var db = sublevel(levelup(process.env.HOME + '/.npmd', {encoding: 'json'}), '~')

var packageDb = db.sublevel('pkg')
var versionDb = db.sublevel('ver-')

levelCouchSync('http://isaacs.iriscouch.com/registry', db, 'registry-sync', 
  function (data, emit) {
    var doc = data.doc

    //don't allow keys with ~

    if(doc._deleted) return
    if(/~/.test(data.id)) return

//    console.log('DOC', doc.name)
    if(!doc.name)
      console.log(doc)

    /*console.log({
      name: !doc.name,
      verson: !doc.versions,
      maintainers: !doc.maintainers,
      len: !doc.maintainers.length,
      mname: !doc.maintainers[0].name
    })*/

    if(!doc.name || !doc.versions) return
    if(!doc.maintainers || !doc.maintainers[0] || !doc.maintainers[0].name)
      return

    emit(data.id, {
      name        : doc.name,
      description : doc.keywords,
      readme      : doc.readme,
      keywords    : doc.keywords,
      author      : doc.author,
      licenses    : doc.licenses,
      repository  : doc.repository,
      maintainers : doc.maintainers
    }, packageDb)

    //versions
    var vers = doc.versions
    for(var version in vers) {
      var ver = vers[version]
      emit(data.id + '!!' + pad(version), {
        name: ver.name,
        version: ver.version,
        dependencies: ver.dependencies,
        devDependencies: ver.devDependencies,
        description: ver.description
      }, versionDb)
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
  index(value.readme)
  index(value.name)
  index(value.author)
  index(value.keywords)
  index(value.description)
}, function (value, query) {
  //todo query 
  return [
    '-----------------------------',
    (value.readme ? value.readme.substring(0, 140) + '...' : value.description || value.name)
    .split('\n').map(function (e) {
      return '  ' + e
    }).join('\n')
  ].join('\n')
})

//indexDb.start()

//how many authors? how many modules?

var authorsDb = db.sublevel('authors')

MapReduce(packageDb, authorsDb, function (key, value, emit) {
  if(!value.maintainers) return
  console.log(value.maintainers[0].name, '/', key)
  emit(value.maintainers[0].name, 1)
}, function (acc, item) {
  return Number(acc || 0) + (isNaN(item) ? 1 : Number(item))
})

/*
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
*/

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
else if(opts.authors) {
  var range = []
  if(opts.authors == true)
    range = [true]
  else 
    range = [opts.authors]

  authorsDb.createReadStream({range: range, tail: opts.tail})
  .on('data', console.log)
}

if(opts.count) {
  authorsDb.createReadStream({range: [], tail: opts.tail})
  .on('data', console.log)
}
