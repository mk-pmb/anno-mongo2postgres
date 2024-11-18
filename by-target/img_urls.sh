#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function img_urls () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local REPORT_DIR='tmp.img_urls'
  mkdir --parents -- "$REPORT_DIR"
  cd -- "$REPORT_DIR" || return $?
  exec </dev/null

  # identify_image_blobs || return $?
  group_image_blobs_by_anno || return $?
}


function identify_image_blobs () {
  local -A LINK_LENGHTS=()
  local -A STORAGE_COST=()
  local -A BLOB_SIZES=()
  local -A BLOB_DUPES=()
  < <(zcat ../tmp.pg.combo_add.sql.gz | grep -Fie '<img' \
    | grep -oPe '^\s*\S+, \d+,|<img [^<>]*>' | tr -d "'"'\\' \
    | LANG=C sed -rf <(echo '
      s~^\s*\(~\n~
      s~\&amp;~\&~g
      s~<img src="([^"<>]+)"( alt="[^"<>]*")*>~\1~g
      $s~$~\n~
    ')
  ) img_urls__summarize_data_urls > >(
    LANG=C sed -rf <(echo '
      : accum
      /\n$/!{N; b accum}
      s~\n~\t~g
      s~^\s+~~
      s~\s+$~~
      s!, !~!
      s!,\t!\t!
    ') | sort -V | sed -rf <(echo '
    ') >urls.tsv)
  img_urls__summarize_overhead | tee -- blobs.tsv
  du -h -- [a-z]*
}


function img_urls__summarize_data_urls () {
  local LN= LL= SZ= BUF= FMT= DECODE= N= HASH= SAVE=
  while IFS= read -r LN; do
    case "$LN" in
      data:*,* ) ;;
      data:* )
        echo E: $FUNCNAME: "Unexpected data: URL syntax: '${LN:0:80}'" >&2
        return 4;;
      * ) echo "$LN"; continue;;
    esac
    FMT="${LN%%,*}"
    BUF="${LN#*,}"
    DECODE='cat'
    FMT="${FMT#data:}"
    case "$FMT" in
      *';base64' ) DECODE='base64 -d';;
    esac
    HASH="$($DECODE <<<"$BUF" | sha1sum --binary -)"
    HASH="${HASH:0:8}"
    LL="${#LN}"
    LINK_LENGHTS["$HASH"]="$LL"

    N="${STORAGE_COST[$HASH]:-0}"
    (( N += LL ))
    STORAGE_COST["$HASH"]="$N"

    N="${BLOB_DUPES[$HASH]:--1}"
    (( N += 1 ))
    BLOB_DUPES["$HASH"]="$N"

    SAVE="${FMT%%;*}"
    SAVE="${SAVE/'/'/.$HASH.}"
    SAVE="${SAVE//'/'/.}"
    SAVE="$REPORT_DIR/$SAVE"
    [ -s "$SAVE" ] || $DECODE <<<"$BUF" >"$SAVE"

    SZ="$(stat -c %s -- "$SAVE")"
    BLOB_SIZES["$HASH"]="$SZ"
    echo "$FMT,hash=$HASH"
  done
}


function img_urls__summarize_overhead () {
  local HASH= LL= SZ= DUP= COST= OVH=
  printf -- '%s\t' blobhash linklen size dupes cost overhead; echo overhead%
  for HASH in "${!STORAGE_COST[@]}"; do
    SZ="${BLOB_SIZES[$HASH]}"
    DUP="${BLOB_DUPES[$HASH]}"
    COST="${STORAGE_COST[$HASH]}"
    LL="${LINK_LENGHTS[$HASH]}"
    (( OVH = COST - SZ ))
    printf -- '%s\t' "$HASH" "$LL" "$SZ" "$DUP" "$COST" "$OVH"
    (( OVH = ( 100 * OVH ) / SZ ))
    echo "$OVH%"
  done | sort -V
}


function group_image_blobs_by_anno () {
  local -A USES=()
  exec < <( sed -rf <(echo '
    s~\thttps?://\S+~~g
    /\t/!d
    s~^(\S+)\t(.*)$~\2\t\1~
    : split
      s~^(\S+\t)(\S+\t)(.*)$~\1\3\n\2\3~
    t split
    ') -- urls.tsv | sed -re 's!\~[0-9]+$!!' | sort --version-sort --unique )
  local URLS=' '
  local -A BY_URL=()
  local ANNO= URL=
  while IFS= read -r URL; do
    ANNO="${URL#*$'\t'}"
    URL="${URL%$'\t'*}"
    URL="${URL#*;base64,hash=}"
    echo "$URL"$'\t'"https://anno.ub.uni-heidelberg.de/anno/$ANNO"
  done

}










[ "$1" == --lib ] && return 0; img_urls "$@"; exit $?
