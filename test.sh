#! /usr/bin/bash


resolve () {
  echo resolving...
  while read r;
  do
    echo resolve "$r"
    time ./index.js resolve "$r"
    time ./index.js "$r" --greedy
    echo
  done
}

cat ./test/resolve.txt | resolve
