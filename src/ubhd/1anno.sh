#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-
exec </dev/null
set -- "${1%\#*}"
ANNO="$(wget -qO - -- https://anno.ub.uni-heidelberg.de/anno/"$1")"
SORTED="$(<<<"$ANNO" json-sort-pmb)" && ANNO="$SORTED"
smart-less-pmb <<<"$ANNO"; exit $?
