exports.cli = function (db, config) {
  db.commands.push(function (db, config, cb) {
    var args = config._.slice()
    if(args.shift() != 'readme') return
    var module = args.shift()
    db.sublevel('pkg').get(module, function (err, data) {
      // console.log(arguments)
      if(err) return cb(err)
      if(!data.readme)
        console.log('sorry, readme file not found.')
      else
        console.log(data.readme)

      cb(null, data.readme || data)
    })
    return true
  })
}
