#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-

function lint_run_log () {
  local JOB="$1"; shift
  JOB="${JOB%.mjs}"
  JOB="${JOB%.txt}"
  JOB="${JOB%.}"
  elp "$JOB".mjs || return $?
  nodemjs "$JOB".mjs |& tee -- tmp.$$."$JOB".txt || return $?
  mv --no-target-directory -- {tmp.$$.,}"$JOB".txt || return $?
}


lint_run_log "$@"; exit $?
