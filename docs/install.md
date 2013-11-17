# npmd install [module@versionRange,...]

Install one or more modules, by copying modules into `node_modules/$module_name`
(see also: [npmd link](./link.md))

## --greedy

greedily dedupe by default. (see [npm resolve](./resolve.md))

## --global

install globally (use for commands)
(sets `path=${npm.config.prefix}/lib` and `bin=${npm.config.prefix}/bin`

## --offline

resolve only modules that are in the local cache.

## --correct

do not use optimistic resolution (a little slower)

## --path $DIR

directory that the target `node_modules` directory should be created in.

## --bin $DIR

place to install bin commands (if any)


