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
  commands: function (db, config) {
    db.commands.push(function (db, config, cb) { 
      var args = config._.slice()
      if(args.shift() !== 'authors')
        return

      if(config.init)
        return authorsDb.start(cb)

      var range = [args.shift() || true]

      db.sublevel('authors').createReadStream({range: range, tail: config.tail})
      .pipe(through(function (data) {
        this.queue(data.key.substring(2) + '\n')
      }))
      .on('end', function () {
          cb()
      })
      .pipe(process.stdout)

      return true
    })
  }
}
