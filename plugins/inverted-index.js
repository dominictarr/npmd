var Inverted = require('level-inverted-index')
var through  = require('through')
var strftime = require('strftime')
var context = require('search-context')
var sort = require('sort-stream')
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
    var stats = context.stats(value.readme || value.description || '', query)
    return {
      name: value.name,
      maintainers: value.maintainers,
      description: value.description || '',
      maintainers: value.maintainers,
      time: strftime('%F %H:%M', new Date(value.time && value.time.modified)),
      keywords: value.keywords || [],
      readme: value.readme,
      stats: stats
    }
  })
}

exports.commands = function (db) {

  function presense (string, args) {
    return Math.pow(args.reduce(function (t, str) {
      return t - (~string.indexOf(str) ? 1 : 0)
    }, args.length), 2)
  }

  function rank (doc, query, c) {
    return (
      presense(doc.name, query)        * (c.searchWeightName        || 0.5)
    + presense(doc.description, query) * (c.searchWeightDescription || 2)
    + ( (doc.stats.stddev              * (c.searchWeightStddev      || 1))
      * (doc.stats.avg                 * (c.searchWeightAvg         || 0.2))
      )                                * (c.searchWeightGroup       || 1)
    )
  }

  db.commands.push(function (db, config, cb) {

  var TTY = process.stdout.isTTY

  var args = config._.slice()
  if(args.shift() != 'search')
    return

  if(!args.length)
    return cb(new Error('expects search term'))

  function highlight (string) {
    return context.highlight(
      string, args,
      function (e) {
        return TTY ? e.bold : '*' + e +'*'
      }
    )
  }


  var header = rpad('NAME', 22)
    + rpad('DESCRIPTION', 61)
    + rpad('AUTHOR', 22)
    + rpad('DATE', 18)

  if (TTY) header = header.slice(0, process.stdout.columns)
  process.stdout.write(header + '\n')

  var showRank = config['show-rank'] === true
  var showReadme = config['show-readme'] !== false

  var lines = 1 + (showRank?1:0) + (showReadme?1:0)

  var maxResults = config.results || (TTY ? Math.floor((process.stdout.rows-2) / lines) : Number.MAX_VALUE)
  if(config.results == true)
  var maxResults = Number.MAX_VALUE
  var i = 0
  db.sublevel('index')
    .createQueryStream(args, {})
    .pipe(through(function (e) {
      e.value.stats = context.stats(e.value.readme || e.value.description || '', args) || {}
      e.value.rank = rank(e.value, args, config)
      if(++i <= maxResults)
        this.queue(e)
      else
        this.queue(null)
    }))
    .pipe(sort(function (a, b) {
      //XXX SORT
      return a.value.rank - b.value.rank
    }))
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

      this.queue(highlight(process.stdout.isTTY
        ? line.slice(0, process.stdout.columns)
        : line
      ) + '\n')

      if(data.value.readme && config.showReadme)
      this.queue((function () {
        //make a modue to find the matches.
        //this is really crude, at the moment.
  
        var l = (config.context || (process.stdout.isTTY ? process.stdout.columns - 10 : 70))

        var m = 
          context.context(data.value.readme, data.value.stats.group, args, l)

        return '    ...'+ highlight(
          m.split('\n')
          .map(function (e) { return e.trim() })
          .join(' ')
          .trim()
        ) + '...\n'
        //option to show the search rank.
        //useful when tuning search ranking
        + (config['show-rank'] ? 'rank=' + data.value.rank + '\n' : '')
      })() || '')

    }))
    .on('end', cb)
    .pipe(process.stdout)

    return true
  })

}

