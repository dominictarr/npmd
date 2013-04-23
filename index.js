#!/usr/bin/env node

var levelCouchSync = require('level-couch-sync')
var pad            = require('padded-semver').pad
var Inverted       = require('level-inverted-index')
var MapReduce      = require('map-reduce')
var opts           = require('optimist').argv
var levelup        = require('levelup')
var sublevel       = require('level-sublevel')
var path           = require('path')

module.exports = function (path, sync) {
  var db = (
    'string' === typeof path
    ? sublevel(levelup(path, {encoding: 'json'}), '~')
    : path //allow user to inject db
  )
  var packageDb = db.sublevel('pkg')
  var versionDb = db.sublevel('ver')

  if(sync !== false)
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
  var indexDb = db.sublevel('index')

  Inverted(packageDb, indexDb, function (key, value, index) {
    if(!(i++ % 100))
      console.log(key)
    index(value.readme)
    index(value.name)
    index(value.author)
    index(value.keywords)
    index(value.description)
  }, function (value, query) {
    /*
    var matches = []
    
    var matchers = 
      query.map(function (str) {
        return new RegExp('(?:\s|^)' + str.replace('~', '.*') + '(?:$|\s)')
      })
    
    //return value.description
    
    value.readme.split('\n')
    */
    return {
      name: value.name,
      maintainers: value.maintainers,
      //version: value.version,
      description: (function () {
        if(!value.readme)
          return value.description

        //make a modue to find the matches.
        //this is really crude, at the moment.

        return value.readme.split('\n')
                .slice(0, 5).join('\n')
      })()
    }
    return [
      '-----------------------------',
      (value.readme ? value.readme.substring(0, 140) + '...' : value.description || value.name)
      .split('\n').map(function (e) {
        return '  ' + e
      }).join('\n')
    ].join('\n')
  })

  //how many authors? how many modules?

  var authorsDb = db.sublevel('authors')

  MapReduce(packageDb, authorsDb, function (key, value, emit) {
    if(!value.maintainers) return
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
  return db
}

if(!module.parent) {
  var db = module.exports(path.join(process.env.HOME, '.npmd'))

  if(opts._.length) {
    if(opts.query)
      return db.sublevel('index').query(opts._)
        .on('data', console.log)
    db.sublevel('index').createQueryStream(opts._)
      .on('data', console.log)
  }


  if(opts.authors && opts.init) {
    db.sublevel('authors').start()
  }
  else if(opts.authors) {
    var range = []
    if(opts.authors == true)
      range = [true]
    else 
      range = [opts.authors]

    db.sublevel('authors').createReadStream({range: range, tail: opts.tail})
    .on('data', console.log)
  }

  if(opts.count) {
    db.sublevel('authors').createReadStream({range: [], tail: opts.tail})
    .on('data', console.log)
  }
}

