
var Inverted = require('level-inverted-index')
var through  = require('through')

exports.db = function (db, config) {
  var packageDb = db.sublevel('pkg')
  var indexDb = db.sublevel('index')

  var i = 0

  Inverted(packageDb, indexDb, function (key, value, index) {
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
      description: value.description || '',
      preview: (function () {
        if(!value.readme) return
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
}

exports.commands = function (db) {
  db.commands.push(function (db, config, cb) {
  var args = config._.slice()
  if(args.shift() != 'search')
    return

  if(!args.length)
    return cb(new Error('expects search term'))

  db.sublevel('index')
    .createQueryStream(args)
    .pipe(through(function (data) {
      this.queue(data.key + '\n')
    }))
    .on('end', cb)
    .pipe(process.stdout)

    return true
  })

}
