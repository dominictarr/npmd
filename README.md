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

## resolve

resolve all module versions required to install a given module.
will write json to stdout in the same format as npm-shrinkwrap. 

```
npmd resolve request
```

## License

MIT
