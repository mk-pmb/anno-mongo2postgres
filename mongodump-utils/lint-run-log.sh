#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function lint_and_run () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  local BFN="$1"; shift
  BFN="${BFN%.mjs}"
  local MJS="$BFN.mjs"
  [[ "$MJS" == */* ]] || MJS="$SELFPATH/$MJS"
  [ -f "$MJS" ] || return 4$(echo "E: no such file: $MJS" >&2)
  cwd+exec "$SELFPATH" elp || return $?
  nodemjs "$MJS" "$@" \
    2> >(unbuffered tee -- "$SELFPATH/tmp.$BFN.err" >&2) \
    > >(unbuffered tee -- "$SELFPATH/tmp.$BFN.txt") \
    || return $?
}


lint_and_run "$@"; exit $?
