#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-

function clear_cache () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH" || return $?
  rm -r -- [a-z]*.*/ || true
  rm -- _anomalies/[0-9]*.json || true
}

clear_cache "$@"; exit $?
