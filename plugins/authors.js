var MapReduce = require('map-reduce')
var through = require('through')

module.exports = {
  db: function (db, config) {
    //how many authors? how many modules?
    var packageDb = db.sublevel('pkg')
    var authorsDb = db.sublevel('authors')

    MapReduce(packageDb, authorsDb, function (key, value, emit) {
      if(!value.maintainers) return
      emit(value.maintainers[0].name, 1)
    }, function (acc, item) {
      return Number(acc || 0) + (isNaN(item) ? 1 : Number(item))
    })

  },
  commands: function (db) {
    db.commands.authors = function (config, cb) { 
     if(config.init)
        return authorsDb.start()
      var range = []
      if(!config._.length)
        range = [true]
      else 
        range = [config._[0]]

      db.sublevel('authors').createReadStream({range: range, tail: config.tail})
      .pipe(through(function (data) {
        this.queue(data.key + '\n')
      }))
      .on('end', function () {
          cb()
      })
      .pipe(process.stdout)
    }
  }
}
