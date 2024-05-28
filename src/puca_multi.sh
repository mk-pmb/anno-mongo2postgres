#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function puca_multi () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH"/../dumps || return $?
  local SYM='latest.anno.jsonld'
  local WAIT= DUMP=
  while [ "$#" -ge 1 ]; do
    (( WAIT = 0 - SECONDS ))
    if [ "$WAIT" -ge 1 ]; then
      echo "Cooldown: $WAIT sec"
      sleep "$WAIT"s
      SECONDS=-61
    fi
    DUMP="$1"; shift
    [ ! -L "$SYM" ] || rm -- "$SYM" || return $?
    ln --verbose --symbolic --no-target-directory -- "$DUMP" "$SYM" || return $?
    ./convert_latest.sh || return $?
  done
}


puca_multi "$@"; exit $?
