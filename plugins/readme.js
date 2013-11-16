exports.cli = function (db, config) {
  db.commands.push(function (db, config, cb) {
    var args = config._.slice()
    if(args.shift() != 'readme') return
    var module = args.shift()
    db.sublevel('pkg').get(module, function (err, data) {
      if(err) return cb(err)
      console.log(data.readme)
      cb(null, data.readme)
    })
  })
}
