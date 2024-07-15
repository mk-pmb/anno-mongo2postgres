#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function find_invalid_body_type_examples () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH" || return $?
  sed -nre '/^ +invalidBodyTypeExamples: \{$/,/^ +\},?$/p' \
    -- ../tmp.ubhd.convertDissectedAnnos.err | tr -d "' " | sed -rf <(echo '
    1d
    $d
    s~,$~~
    s~\{~:~
    s~\}~~
    s~^([a-z]{6})[a-z]+~\1~
    s~^([^:]+):([^:]+):([^:]+)$~\1\t\3\t\2~
    ') | sort -V
}


find_invalid_body_type_examples "$@"; exit $?
