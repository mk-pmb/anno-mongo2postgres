#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function undissect () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH" || return $?

  local MONGO_ID="$1"
  local BFN="tmp.$FUNCNAME"
  find [a-z]*.*/ -name "*.$1.*.json" \
    | sed -re 's~(\.)(dp\-.json)$~\1\a\2~' \
    | LANG=C sort \
    | sed -re 's~\a~~' \
    | tee -- "$BFN".files \
    | xargs --max-lines=1 --no-run-if-empty -- cat -- \
    | sed -rf <(echo '
      1s~^\{~[&~
      s~^\}$~&,~
      $s~,$~]~
    ') >"$BFN".json
  ls -l -- "$BFN".*
  head --lines=1 -- "$BFN".files
}










[ "$1" == --lib ] && return 0; undissect "$@"; exit $?
