#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function gen_index_mjs () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH" || return $?

  exec >index.mjs || return $?
  echo '// -*- coding: utf-8, tab-width: 2 -*-'
  echo

  # Only scan for the export statements once we have started writing
  # a new index.mjs, so we won't have that one in our list.
  local FILES="$(grep -lPe '^export ' -- *.mjs | LANG=C sort)"
  <<<"$FILES" sed -re 's~^(\S+)\.mjs$~import \1 from '"'./&';~"
  echo
  echo 'export default {'
  <<<"$FILES" sed -re 's~^~  ~;s~\.mjs$~,~'
  echo '};'
}










gen_index_mjs "$@"; exit $?
