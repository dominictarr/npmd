# npmd

distributed npm client.

`npmd` is an alternative npm client that uses leveldb and local replication to
improve performance by eliminating unnecessary network round-trips.
It is intended for use in the antipodes, via 3g, in airplanes, submarines, up trees, and in caves.
But it is still faster if you live in california too.

## how

`npmd` is based on the idea of eager replication.
All the npm metadata (package.json + readmes) are stored locally in leveldb.
(currently, with 44k modules this is about 260 mb)
when you type `npmd install foo <enter>` npmd resolves all the dependencies
from your local replica, without doing any network round-trips.
This is much faster than using npm, especially if you have a high latency internet connection.

A local database also enables `npmd` to provide offline search, and indexes all readmes.

When you actually install a module, that tarball is cached for next time you install it that version.
(regular npm does this also).

## help

display help files

```
npmd help $command
```

## sync

To begin, replicate the registry metadata.
When this gets near 100% you can use the other commands.

```
npm install npmd -g
npmd --sync
```

You should leave the `npmd` service running in the background,
this will make running other `npmd` commands much faster.

npmd will pull down npm metadata, and store it in a leveldb.
this will be less than 200mb, including a full text index.

Check the [startup_configs](startup_configs/) directory for examples of system startup configurations and instructions on how to set them up.

## install

install a module. if the module's dependencies are in the cache,
then `npmd` will install without making a single network round trip!

```
npmd install browserify --greedy
```

`--greedy` is optional, if enabled, the dependency tree is flattened as much as possible.
so you have less duplication.

use `--global` to install a command globally.

## link

Install by linking. This is much faster than install, because it is not necessary to copy files.

## publish

publish a module locally. In a package directory, just do:

```
npmd publish
```

and your package version will be stashed into a queue for local use. You can
`npmd install yourpkg` locally even if `yourpkg` isn't on the public npm yet.
You can even have multiple versions of your package queued up locally.

To inspect your local package queue, do:

```
npmd queue
```

You can remove a package from your queue with:

```
npmd queue rm pkgname@version
```

To sync your local package queue with the public npm, you can run:

```
npmd queue sync
```

## resolve

resolve all module versions required to install a given module.
will write json to stdout in the same format as npm-shrinkwrap. 

```
npmd resolve request
```

## License

MIT
