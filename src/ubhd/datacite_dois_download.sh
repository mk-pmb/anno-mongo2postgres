#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function datacite_dois_download () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH" || return $?
  eval local -A FACTS=( $(
    sed -nre 's~,$~~;s~^\s*([A-Za-z]+): ~[\1]=~p' -- facts.mjs) )
  local URL="https://${FACTS[dataCiteApiHost]}/dois"$(
    )"?page[size]=9009009&query=id:${FACTS[digiDoi]}*"
  local DEST="tmp.$FUNCNAME.$$.json"
  echo -n "$DEST <-"
  wget --output-document="$DEST" -- "$URL"
}


datacite_dois_download "$@"; exit $?
