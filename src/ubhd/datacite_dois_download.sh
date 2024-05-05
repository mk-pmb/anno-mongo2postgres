#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function datacite_dois_download () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH" || return $?
  local PRFX="$(grep -Fe digiDoi: -- facts.mjs | cut -d \' -f 2)"
  [ -n "$PRFX" ] || return 4$(echo E: 'Failed to read DOI PRFX' >&2)
  local URL="https://api.datacite.org/dois?page[size]=9009009&query=id:$PRFX*"
  local DEST="tmp.$FUNCNAME.$$.json"
  echo -n "$DEST <-"
  wget --output-document="$DEST" -- "$URL"
}


datacite_dois_download "$@"; exit $?
