#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function lint_and_run () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"

  if [ "$1" == '>' ]; then shift; exec >"$1" || return $?; shift; fi

  local BFN="$1"; shift
  BFN="${BFN%.mjs}"
  local MJS="$BFN.mjs"
  [[ "$MJS" == /* ]] || MJS="$SELFPATH/$MJS"
  [ -f "$MJS" ] || return 4$(echo "E: no such file: $MJS" >&2)

  just_lint >&2 || return $?


  local TMP_BFN="$SELFPATH/tmp.${BFN//\//.}"
  nodemjs "$MJS" "$@" \
    2> >(unbuffered tee -- "$TMP_BFN.err" >&2) \
    > >(unbuffered tee -- "$TMP_BFN.txt") \
    || return $?
}


function just_lint () {
  cd -- "$SELFPATH" || return $?
  if which elp | grep -qFe '^/'; then elp || return $?; fi
  eslint --ext=js,mjs . && echo '+OK eslint succeeded.' || return $?
}




lint_and_run "$@"; exit $?
