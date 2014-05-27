#! /bin/bash

set -e
NPMD="$PWD"/index.js

resolve () {
  echo resolving...
  cd $HOME
  while read r;
  do
    echo resolve "$r"
    time $NPMD resolve "$r"
    time $NPMD resolve "$r" --greedy
    echo
  done
}

cat ./test/resolve.txt | resolve
