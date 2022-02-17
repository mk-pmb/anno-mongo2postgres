#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function collect_by_mongoid () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH" || return $?

  local MAX_LN=9009009
  local MONGO_IDS=( "$*" )
  case "${MONGO_IDS[0]}" in
    err )
      MONGO_IDS=( "$(grep -Fe 'errorsIds: [' -A $MAX_LN \
        -- ../../mongodump-utils/tmp.convertSimpleAnnos.err \
        | grep -m 1 -Fe ']' -B $MAX_LN)" )
      ;;
  esac

  if [ -z "${MONGO_IDS[0]}" ]; then
    echo "D: reading mongo IDs from stdin, '.' or ']' = end of list:" >&2
    MONGO_IDS=( "$(sed -nrf <(echo '
      s~\s~~g
      /^\.$/q
      /^\],?$/q
      p
      '))" )
  fi
  readarray -t MONGO_IDS < <(sed -nrf <(echo '
    s~\s~~g
    s~\]|,|\x22|\x27~~g
    /^[A-Za-z]+:\[$/b
    /\S/p
    ') <<<"${MONGO_IDS[0]}")
  local M_ID= ORIG=
  for M_ID in "${MONGO_IDS[@]}"; do
    ORIG="$(find ../[a-z]*.*/ -name "*.$M_ID.*.json")"
    <<<"$ORIG" grep --color=always -Fe ".$M_ID."
    cp --no-clobber --target-directory=. -- "$ORIG"
  done
}










collect_by_mongoid "$@"; exit $?
