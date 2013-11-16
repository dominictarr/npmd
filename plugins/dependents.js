exports.cli = function (db) {
    var seen = {}
    db.commands.push(function (db, config, cb) {
        var args = config._.slice();
        if (args.shift() != "dependents") return;

        var modulenames = args;

        db.sublevel('ver').createReadStream({
        }).on('data', function (data) {
            var pkg = data.value;

            if (pkg.hasOwnProperty("dependencies") && pkg.dependencies != null) {
                var all = true;

                modulenames.forEach(function (modulename) {
                    if (!pkg.dependencies.hasOwnProperty(modulename))
                        all = false;
                });

                // TODO: pipe this off into some stream other than process.stdout
                if (all === true)
                    if (config.verbose)
                        console.log(pkg.name + "@" + pkg.version)
                    else {
                        if(seen[pkg.name]) return
                        seen[pkg.name] = true
                        console.log(pkg.name);
                    }
            }
        }).on('end', cb);

        return true;
    });
};
