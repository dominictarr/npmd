
var Inverted = require('level-inverted-index')
var through  = require('through')
var strftime = require('strftime')
var context = require('search-context')

function rpad (s, n) {
  if (!s) s = ''
  return s + Array(Math.max(2, n - s.length + 1)).join(' ')
}

function trim (s, n) {
  if (!s) s = ''
  if (s.length <= n) return s
  return s.slice(0, n - 4) + '... '
}

exports.db = function (db, config) {
  var packageDb = db.sublevel('pkg')
  var indexDb = db.sublevel('index')

  var i = 0

  Inverted(packageDb, indexDb, function (key, value, index) {
    index(value.readme)
    index(value.name)
    index(value.author)
    index(value.keywords)
    index(value.description)
  }, function (value, query) {
    return {
      name: value.name,
      maintainers: value.maintainers,
      description: value.description || '',
      maintainers: value.maintainers,
      time: strftime('%F %H:%M', new Date(value.time && value.time.modified)),
      keywords: value.keywords || [],
      readme: value.readme
    }
  })
}

exports.commands = function (db) {
  db.commands.push(function (db, config, cb) {
  var args = config._.slice()
  if(args.shift() != 'search')
    return

  if(!args.length)
    return cb(new Error('expects search term'))

  var header = rpad('NAME', 22)
    + rpad('DESCRIPTION', 61)
    + rpad('AUTHOR', 22)
    + rpad('DATE', 18)
  if (process.stdout.isTTY) header = header.slice(0, process.stdout.columns)
  process.stdout.write(header + '\n')
 
  db.sublevel('index')
    .createQueryStream(args, {})
    .pipe(through(function (data) {
      var over = Math.max(0, data.key.length - 21)
      var authors = data.value.maintainers
        .map(function (s) { return '=' + s.name })
        .join(' ')
      var line = rpad(data.key, 22)
        + trim(rpad(data.value.description, 61), 61 - over)
        + trim(rpad(authors, 22), 22 - over)
        + trim(rpad(data.value.time, 18), 18 - over)
        + data.value.keywords.join(' ')
      this.queue((process.stdout.isTTY
        ? line.slice(0, process.stdout.columns)
        : line
      ) + '\n')

      if(data.value.readme)
      this.queue((function () {
        //make a modue to find the matches.
        //this is really crude, at the moment.
  
        var l = (config.context || (process.stdout.isTTY ? process.stdout.columns - 10 : 70))
        var m = context(data.value.readme, args, l)
        return '    ...'+ (
          m.split('\n')
          .map(function (e) { return e.trim() })
          .join(' ')
          .substring(0, l).trim()
        ) + '...\n'
      })() || '')

    }))
    .on('end', cb)
    .pipe(process.stdout)

    return true
  })

}

