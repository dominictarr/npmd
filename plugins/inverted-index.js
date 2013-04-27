
var Inverted       = require('level-inverted-index')

module.exports = function (db, config) {
  var packageDb = db.sublevel('pkg')
  var indexDb = db.sublevel('index')

  var i = 0

  Inverted(packageDb, indexDb, function (key, value, index) {
    if(!(i++ % 100))
      console.error(key)
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
}
