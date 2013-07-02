var levelCouchSync = require('level-couch-sync')
var pad            = require('padded-semver').pad

exports.db = function (db, config) {
  console.log(db._prefix)
  var packageDb = db.sublevel('pkg')
  var versionDb = db.sublevel('ver')

  //if a date is missing, use this number.
  var yearZero = new Date(2009, 1, 1)

  if(!(config && config.sync))
    return db.sublevel('registry-sync')

  var lastPercentage = 0
  var registrySync
  if(config.sync !== false) {

    registrySync = 
    levelCouchSync(config.registry, db, 'registry-sync', 
    function (data, emit) {
      var doc = data.doc

      if(doc._deleted) return
      //ignore broken modules
      if(!doc._attachments) return

      //don't allow keys with ~
      if(/~/.test(data.id)) return

      //is a design doc
      if(!doc.name || !doc.versions) return
      if(!doc.maintainers || !doc.maintainers[0] || !doc.maintainers[0].name)
        return

      try {

        //set time to something sensible by default.
        var time = doc.time ? {
            created  : doc.time.created,
            modified : doc.time.modified
          } : {
            created  : yearZero,
            modified : yearZero
          }

        emit(data.id, {
          name        : doc.name,
          description : doc.keywords,
          readme      : doc.readme,
          keywords    : doc.keywords,
          author      : doc.author,
          licenses    : doc.licenses,
          repository  : doc.repository,
          maintainers : doc.maintainers,
          time        : time
        }, packageDb)


        //versions
        var vers = doc.versions
        for(var version in vers) {
          var ver = vers[version]
          var tgz = doc.name + '-' + version + '.tgz'
          if(doc._attachments[tgz])
            emit(data.id + '!' + pad(version), {
              name            : ver.name,
              version         : ver.version,
              dependencies    : ver.dependencies,
              devDependencies : ver.devDependencies,
              description     : ver.description,
              size            : doc._attachments[tgz].length,
              time            : doc.time ? doc.time[version] : yearZero,
              shasum          : ver.dist.shasum,
              gypfile         : ver.gypfile
            }, versionDb)

        }
      } catch (err) {
        console.error(err.stack)
        throw err
      }
    })

  }

  if(config.debug)
    registrySync.on('progress', function (ratio) {
      var percentage = Math.floor(ratio*10000)/100
      if (percentage > lastPercentage) {
        console.error(percentage)
        lastPercentage = percentage
      }
    })
}

exports.cli = function (db) {
  db.cli.push(function (db, config, cb) {
    if(!config.sync) return

    if(config.verbose)
      db.sublevel('pkg').post(function (op) {
        var pkg = JSON.parse(op.value)

        var maintainers = pkg.maintainers.map(function (e) {
          return e.name
        }).join(', ')
        console.log(pkg.name, maintainers, pkg.time.modified)
        if(pkg.description)
          console.log(pkg.description)
      })

    return true
  })
}
