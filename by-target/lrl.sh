#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-

function cli_main () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH" || return $?

  local TASK="$1"; shift
  case "$TASK" in
    clean )
      clear_cache || return $?
      rm -- tmp.* || return $?
      ;;
    dis ) re_diss "$@";;
    dis- ) re_diss_digi +cpg389+annotationen_test "$@";;
    pg ) lrl_cda <tmp.dissect.all.json "$@";;
    pg1k ) lrl_cda <tmp.dissect.all.json limit=1e3 "$@";;
    re ) lrl_cda <tmp.undissect.json prgi=1 "$@";;
    * ) echo "E: unknown task" >&2; return 3;;
  esac || return $?
}


function re_diss () {
  clear_cache || return $?
  lrl9e9 ubhd/dissect "$@" <../dumps/latest.jsonld || return $?
}


function re_diss_digi () {
  local SUBDIRS="$1"; shift
  SUBDIRS="${SUBDIRS//+/ ubhd.digi/diglit/}"
  re_diss --onlySaveDirs="$SUBDIRS" "$@" || return $?
}


function clear_cache () {
  rm -r -- [a-z]*.*/ || true
  rm -- _anomalies/[0-9]*.json || true
}


function lrl9e9 () {
  local JOB=()
  if [ "$1" == '>' ]; then JOB+=( "$1" "$2" ); shift 2; fi
  JOB+=( "$1" ); shift
  ../src/lint-run-log.sh "${JOB[@]}" limit=9e9 "$@"
}


function lrl_cda () {
  lrl9e9 ubhd/convertDissectedAnnos "$@" || return $?
  concat_sql_files tmp.pg.anno_combo.sql \
    ../src/structure.sql \
    tmp.pg.anno_*.sql || return $?
  rm -- tmp.pg.anno_*.sql.gz
  gzip tmp.pg.anno_*.sql || return $?
}


function concat_sql_files () {
  local DEST="$1"; shift
  local SRC= CHAP=
  for SRC in "$@"; do
    [ "$SRC" == "$DEST" ] && continue
    CHAP="-- >> >> $SRC >> >> >> >> >>"
    echo "$CHAP"
    cat -- "$SRC"
    echo "${CHAP//>/<}"
    echo
    echo
  done >"$DEST" || return $?
  printf '%s\n' \
    '-- pgAdminer needs a statement (i.e. not comment) at end of file:' \
    "SELECT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')"' AS "success";' \
    >>"$DEST" || return $?
}







cli_main "$@"; exit $?
