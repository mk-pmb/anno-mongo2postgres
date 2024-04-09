#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-

function cli_main () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH" || return $?

  local MAX_MEM_MB=2048
  # ^-- @2023-03-17, node.js somehow went wild and forced the kernel into
  #     OOM, seemingly by JSON.parse. This has never happened before for
  #     this dump, so it's probably very rare. Let's defend nonetheless.
  ulimit -v $(( $MAX_MEM_MB * 1024 ))

  local TASK="$1"; shift
  case "$TASK" in
    clean )
      clear_cache || return $?
      rm -- tmp.* || return $?
      ;;
    dis ) re_diss "$@";;
    dis- ) re_diss_digi +cpg148+cpg389+annotationen_test "$@";;
    dis-wg ) re_diss_digi +cpg389 "$@";;
    pg ) lrl_cda <tmp.dissect.all.json "$@";;
    pg1k ) lrl_cda <tmp.dissect.all.json limit=1e3 "$@";;
    re ) lrl_cda <tmp.undissect.json prgi=1 "$@";;
    * ) echo "E: unknown task" >&2; return 3;;
  esac || return $?
}


function re_diss () {
  clear_cache || return $?
  lrl9e9 ubhd/dissect "$@" <../dumps/latest.anno.jsonld || return $?
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
  local DB_INIT='dbinit_structure.gen.mjs'
  [ -f "$DB_INIT" ] || return 4$(
    echo "E: Missing $DB_INIT! Read .gitignore for how to fix." >&2)
  local STRU='tmp.structure.sql'
  nodemjs "$DB_INIT" >"$STRU" || return $?
  grep -qPe '^CREATE TABLE ' -- "$STRU" \
    || echo "W: Found no 'CREATE TABLE' in $STRU!" >&2

  lrl9e9 ubhd/convertDissectedAnnos "$@" || return $?

  echo -n 'Checking SQL files for badwords: '
  local BADWORDS='
    s~("creator":\{"id":")urn(:uuid:)~\1<ok>\2~
    s~.{0,40}urn:.{0,40}~\a&\f~g
    '
  BADWORDS="$(<tmp.pg.anno_data.sql sed -rf <(echo "$BADWORDS"
    ) | grep -m 10 --color=always -noPe '\a[^\f]+')"
  [ -z "$BADWORDS" ] || return 4$(echo E: "Found badwords: $BADWORDS" >&2)
  echo 'ok.'

  echo -n 'Generating combined SQL files: '
  local DATA_FILES=( tmp.pg.anno_*.sql )
  concat_sql_files tmp.pg.anno_combo_reset.sql "$STRU" \
    "${DATA_FILES[@]}" || return $?
  concat_sql_files tmp.pg.anno_combo_add.sql \
    "${DATA_FILES[@]}" || return $?
  rm -- tmp.pg.anno_*.sql.gz
  gzip tmp.pg.anno_*.sql || return $?
  echo 'done.'
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
