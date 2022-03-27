#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-

function cli_main () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH" || return $?

  local TASK="$1"; shift
  case "$TASK" in
    clean ) clear_cache;;
    dis ) clear_cache && lrl9e9 ubhd/dissect <../dumps/latest.jsonld "$@";;
    pg ) lrl_cda <tmp.dissect.all.json "$@";;
    pg1k ) lrl_cda <tmp.dissect.all.json limit=1e3 "$@";;
    re ) lrl_cda <tmp.undissect.json prgi=1 "$@";;
    * ) echo "E: unknown task" >&2; return 3;;
  esac || return $?
}


function clear_cache () {
  rm -r -- [a-z]*.*/ || true
  rm -- _anomalies/[0-9]*.json || true
}


function lrl9e9 () {
  local JOB=()
  if [ "$1" == '>' ]; then JOB+=( "$1" "$2" ); shift 2; fi
  JOB+=( "$1" ); shift
  ../mongodump-utils/lint-run-log.sh "${JOB[@]}" limit=9e9 "$@"
}


function lrl_cda () {
  lrl9e9 '>' tmp.conv.sql ubhd/convertDissectedAnnos "$@"
}







cli_main "$@"; exit $?
