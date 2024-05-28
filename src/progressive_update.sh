#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function pu_cli_init () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH"/.. || return $?

  local DATE_STR="$(date +%y%m%d-%H%M)"
  local PU_BASE_DIR='tmp.pu'
  local PU_DATE_DIR="$PU_BASE_DIR/$DATE_STR"

  if [ "$1" == redo ]; then
    shift
  elif pu_collect; then
    echo
  else
    rmdir --verbose -- "$PU_DATE_DIR"
    echo
    echo E: $FUNCNAME: 'Failed to collect new files.' \
      'Try adding "redo" to the CLI arguments.' >&2
    return 4
  fi

  cd -- "$PU_BASE_DIR" || return $?
  if [ ! -d prev ]; then
    echo D: $FUNCNAME: 'No "prev" symlink => nothing to do.'
    return 0
  fi
  local MAXLN=9009009009
  local COMBO='crnt/combo_update.sql'
  >"$COMBO"
  local CRNT= PREV= TBL= UPD= VAL=
  for CRNT in crnt/pg.anno_*.sql.gz; do
    TBL="${CRNT##*/pg.anno_}"
    TBL="${TBL%%.*}"
    PREV="${CRNT/#'crnt/'/'prev/'}"
    echo -n "Comparing diffrences in prev/crnt table $TBL:"$'\t'
    UPD="crnt/upd.$TBL.sql"
    diff -U "$MAXLN" -- <(pu_dump_tbl "$PREV") <(pu_dump_tbl "$CRNT"
      ) | sed -rf <(echo '
      1,3d
      /^ +\(/d
      s~^\+( +\()~\1~
      s~^ ((INSERT|REPLACE) INTO )~\1~
      $s~\)$~&;~
      s~\)$~&,~
      ') >"$UPD"
    VAL="$(grep -Pe '^\s+\(' -- "$UPD" | wc --lines)"
    echo "$VAL new records."
    if [ "$VAL" -ge 1 ]; then
      cat -- "$UPD" >>"$COMBO" || return $?
      echo >>"$COMBO" || return $?
    fi
  done
  echo "SELECT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')" \
    'AS "success";' >>"$COMBO" || return $?
  gzip -- "$COMBO" || return $?

  echo
  echo "Done. To sync the DB, import: $PU_BASE_DIR/$COMBO.gz"
}


function pu_collect () {
  mkdir --parents -- "$PU_DATE_DIR" || return $?

  # rm --verbose -- "$BYT"dissect.all.json 2>/dev/null
  local LIST=(
    by-target/tmp.structure.sql
    by-target/tmp.pg.*.sql.gz
    src/tmp.ubhd.*.{txt,err}
    )
  local ORIG= DEST=
  for ORIG in "${LIST[@]}"; do
    DEST="$(basename -- "$ORIG")"
    DEST="${DEST#tmp.}"
    DEST="${DEST#pg.}"
    DEST="${DEST#ubhd.}"
    DEST="$PU_DATE_DIR/$DEST"
    mv --verbose --no-clobber --no-target-directory \
      -- "$ORIG" "$DEST" || return $?
  done

  rm --verbose -- "$PU_BASE_DIR"/prev
  mv --verbose --no-target-directory -- "$PU_BASE_DIR"/{crnt,prev}
  ln --verbose --symbolic --no-target-directory \
    -- "$DATE_STR" "$PU_BASE_DIR"/crnt || return $?
  echo D: 'New files have been collected.'
}


function pu_dump_tbl () {
  gzip --decompress --stdout -- "$1" | sed -rf <(echo '
    /^$/d
    1!{
      /^(INSERT|REPLACE) INTO /d
    }
    s~\)[,;]$~)~
    ')
}











pu_cli_init "$@"; exit $?
