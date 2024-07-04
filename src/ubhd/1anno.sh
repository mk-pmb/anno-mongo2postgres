#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-
exec </dev/null
ANNO='https://anno.ub.uni-heidelberg.de/'
case "$1" in
  at ) shift; ANNO+='anno-test/';;
esac
set -- "${1%\#*}"
FETCH=( wget --no-verbose --output-document=- -- "${ANNO}anno/$1" )
# echo D: "${FETCH[*]}"
ANNO="$("${FETCH[@]}")"
[ "${ANNO:0:1}" == '{' ] && SORTED="$(<<<"$ANNO" json-sort-pmb
  )" && ANNO="$SORTED"
smart-less-pmb <<<"$ANNO"; exit $?
