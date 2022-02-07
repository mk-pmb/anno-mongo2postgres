#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function toplist () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH" || return $?

  local ALL_FILES="$(find ./[a-z0-9]*/ -name '*.json')"
  ( printf '% 7s\ttotal\n' "$(<<<"$ALL_FILES" wc --lines)"
    <<<"$ALL_FILES" sed -rf <(echo '
      s~^\./~~
      s~/[^/]+$~~
      s~/~\t~
      ') | sort | uniq --count | sort --general-numeric-sort --reverse
  ) | sed -rf <(echo '
    s~^( *[0-9]+) ~\1\t~
    ') | tee -- toplist.txt
}










[ "$1" == --lib ] && return 0; toplist "$@"; exit $?
