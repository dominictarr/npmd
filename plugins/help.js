var fs = require('fs')

exports.cli = function (db, config) {

  db.commands.push(function (db, cache, config, cb) {
    if(config._[0] !== 'help') return

    fs.createReadStream(__dirname + '/../docs/' + (config._[1] || 'help') + '.md')
    .on('end', cb)
    .on('error', function () {
      fs.readdir(__dirname + '/../docs/', function (err, list) {
        console.log('npmd help \n  ' + 
          list
          .map(function (e) { return e.replace(/.md$/, '') })
          .filter(function (e) { return e!== 'help' })
          .sort().join(', ')
        )
        cb()
      })
      fs.createReadStream(__dirname + '/../docs/' + (config._[1] || 'help') + '.md')

    })
    .pipe(process.stdout)
    
    return true
  })
}
