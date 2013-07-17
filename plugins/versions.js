

exports.cli = function (db, config) {
  db.commands.push(function (db, config, cb) {
    var args = config._.slice()
    if(args.shift() != 'versions') return
    var module = args.shift()
    db.sublevel('ver').createReadStream({
      min: module + '!', max: module + '!~'
    }).on('data', function (data) {
      var pkg = data.value
      if(config.long)
        console.log(pkg)
      else
        console.log(pkg.name + '@' + pkg.version)
    })
    .on('end', cb)
    return true
  })
}
