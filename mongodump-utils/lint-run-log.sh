#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function lint_and_run () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local BFN="$1"; shift
  BFN="${BFN%.mjs}"
  local MJS="$BFN.mjs"
  [ -f "$MJS" ] || return 4$(echo "E: no such file: $MJS" >&2)
  elp || return $?
  nodemjs "$MJS" "$@" \
    2> >(unbuffered tee -- "tmp.$BFN.err" >&2) \
    > >(unbuffered tee -- "tmp.$BFN.txt") \
    || return $?
}


lint_and_run "$@"; exit $?
