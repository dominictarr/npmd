var MapReduce = require('map-reduce')


module.exports = function (db, config) {
  //how many authors? how many modules?
  var packageDb = db.sublevel('pkg')
  var authorsDb = db.sublevel('authors')

  MapReduce(packageDb, authorsDb, function (key, value, emit) {
    if(!value.maintainers) return
    emit(value.maintainers[0].name, 1)
  }, function (acc, item) {
    return Number(acc || 0) + (isNaN(item) ? 1 : Number(item))
  })

}

