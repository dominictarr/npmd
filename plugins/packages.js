
exports.cli = function (db, config) {
  db.commands.push(function (db, config, cb) {
    var args = config._.slice()
    if(args.shift() != 'packages') return
    var module = args.shift()
    db.sublevel('pkg').createReadStream({
      min: module , max: module + '~'
    }).on('data', function (data) {
      var pkg = data.value
      if(config.long)
        console.log(JSON.stringify(pkg, null, 2))
      else
        console.log(pkg.name)
    })
    .on('end', cb)
    return true
  })
}
