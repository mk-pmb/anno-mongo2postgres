#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function slice () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH" || return $?

  export TLA_LIMIT="$1"; shift
  export TLA_SKIP="$1"; shift

  exec <../dumps/latest.jsonld
  exec >tmp.flat.json
  exec nodejs mongo2pg.mjs
}


slice "$@"; exit $?
