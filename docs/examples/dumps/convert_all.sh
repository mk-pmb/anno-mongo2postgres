#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function convert_all () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH" || return $?
  local LRL='../../../src/lint-run-log.sh'
  local FAKE_ID='--fakeMongoId=idSlug'
  echo 'Collect annotations:'
  < <(cat_ensure_newline_after_each_file */*.jsonld
    ) "$LRL" dissect $FAKE_ID --saveDumps=void:// || return $?
  echo 'Convert to postgres:'
  "$LRL" convertDissectedAnnos/index <tmp.dissect.all.json || return $?
}


function cat_ensure_newline_after_each_file () { sed -sre '$a\\' -- "$@"; }


convert_all "$@"; exit $?
