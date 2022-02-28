#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function divecmp () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  # cd -- "$SELFPATH" || return $?

  local JSON_FILE="$1"; shift
  local REC_IDX_A="$1"; shift
  local REC_IDX_B="$1"; shift
  local JSON_PATH="$1"; shift
  JSON_PATH="$(<<<"$JSON_PATH" sed -rf <(echo '
    s~^\.*~.~
    s~\.([0-9]+)~\[\1\]~g
    '))"
  colordiff -sU 9009009 \
    --label "[$REC_IDX_A]$JSON_PATH" <(
      jq --raw-output ".[$REC_IDX_A]$JSON_PATH" -- "$JSON_FILE" | prettify) \
    --label "[$REC_IDX_B]$JSON_PATH" <(
      jq --raw-output ".[$REC_IDX_B]$JSON_PATH" -- "$JSON_FILE" | prettify) \
    | less --RAW-CONTROL-CHARS --chop-long-lines
}


function prettify () {
  sed -rf <(echo '
    s~$~¶~
    s~</p>~&\n~g
    s~([A-Za-z][.!?;,:]) ~\1\n~g
    s~ \n~ «—{space}\n~g
    ');
}










divecmp "$@"; exit $?
