#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-

function misc () {
  local TASK="$1"; shift
  case "$TASK" in
    dis ) ./clear_cache.sh && lrl9e9 dissect <../dumps/latest.jsonld "$@";;
    pg ) lrl_cda <tmp.dissect.all.json "$@";;
    pg1k ) lrl_cda <tmp.dissect.all.json limit=1e3 "$@";;
    re ) lrl_cda <tmp.undissect.json prgi=1 "$@";;
    * ) echo "E: unknown task" >&2; return 3;;
  esac || return $?
}


function lrl9e9 () {
  local JOB=()
  if [ "$1" == '>' ]; then JOB+=( "$1" "$2" ); shift 2; fi
  JOB+=( "$1.ubhd" ); shift
  ../mongodump-utils/lint-run-log.sh "${JOB[@]}" limit=9e9 "$@"
}


function lrl_cda () {
  lrl9e9 '>' tmp.conv.sql convertDissectedAnnos "$@"
}


misc "$@"; exit $?
