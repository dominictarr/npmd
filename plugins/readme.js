
exports.cli = function (db, config) {
  db.commands.push(function (db, config, cb) {
    var args = config._.slice()
    if(args.shift() != 'readme') return
    var modlue = args.shift()
    db.sublevel('pkg').createReadStream({
      min: module, max: module
    }).on('data', function (data) {
      console.log(data.value.readme)
    })
    .on('end', cb)
    return true
  })
}
