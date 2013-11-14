# npmd

distributed npm client.

## synposis

An alternative npm client, based around a local replication of the npm metadata.
(package.json & readmes are replicated for every package, but only tarballs that 
you have installed are replicated)

replicating data locally makes the client much smarter, 
and enables all manner of Mad Science.

## sync

To begin, replicate the registry metadata. When this gets near 100%
you can use the other commands.

```
npm install npmd -g
npmd --sync
```

You should leave the `npmd` service running in the background,
this will make running other `npmd` commands much faster.

npmd will pull down npm metadata, and store it in a leveldb.
this will be less than 200mb, including a full text index.

## install

install a module. if the module's dependencies are in the cache,
then `npmd` will install without making a single network round trip!

```
npmd install browserify --greedy
```

`--greedy` is optional, if enabled, the dependency tree is flattened as much as possible.
so you have less duplication.

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
