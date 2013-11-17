# npmd link [module@version,...]

install one or more modules by linking.

`npmd link` does not copy modules into your `./node_modules` directory,
but just symlinks them. This is much faster,
you will get a full dependency tree, and it is not possible to dedupe this install style.

## --global

install globally (use for commands)
(sets `path=${npm.config.prefix}/lib` and `bin=${npm.config.prefix}/bin`

## --path $DIR

directory that the target `node_modules` directory should be created in.

## --bin $DIR

place to install bin commands (if any)


