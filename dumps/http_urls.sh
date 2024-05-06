#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-
#
# This script scans the latest database dump for deprecated URLs that
# should be upgraded, which in our case currently means plain http: URLs.
#
# We have to update the targets in the actual anno, rather than just
# in anno_links, because otherwise revisions (and potentially replies)
# will be submitted with the original target URL and thus won't be
# found by search.
#
# In earlier versions, we tried to use the node.js scripts to upgrade
# URLs on-the-fly and only in the places where it's most necessary.
# However, this attempt grew too complex, so now we just run sed scripts
# on the dump to upgrade, and use this script to verify whether we caught
# all of them.


function http_urls () {
  export LANG=C
  local BFN="$FUNCNAME"

  local PREFIXES_IGNORE='
    http://anno.test/
    http://anthologia.ecrituresnumeriques.ca/
    http://archive.pamatnik-terezin.cz/
    http://artjournals.uni-hd.de/
    http://benvenutodaimola.it/
    http://localhost(:[0-9]+|)/
    http://purl.org/dc/
    http://reader.digitale-sammlungen.de/
    http://terminology.lido-schema.org/lido
    http://www.marquesdecollections.fr/
    http://www.w3.org/
    '

  local PREFIXES_SSLIFY='
    http://(www.|)anthologiagraeca.org/[a-z]+/urn:cts:greekLit:
    http://[a-z]+.wiki[pm]edia.org/
    http://[a-z0-9]+.ub.uni-heidelberg.de/
    http://arachne.uni-koeln.de/item/objekt/
    http://archiv.twoday.net/stories/
    http://archivalia.hypotheses.org/
    http://archivum-laureshamense-digital.de/view/
    http://bibliotheca-laureshamensis-digital.de/
    http://census.bbaw.de/easydb/
    http://data.perseus.org/[a-z]+/urn:cts:greekLit:
    http://d-nb.info/gnd/
    http://www.lostart.de/
    http://www.meketre.org/repository/
    '

  local RUNMODE="$1"; shift
  "${RUNMODE:-cli_report}" "$@" || return $?
}


function cli_report () {
  # Close stdin to ensure any messing up of a pipe below won't waste
  # user's time waiting for manual input:
  exec </dev/null

  local ALL_RAW="$BFN.all_raw.txt.gz"
  if [ ! -f "$ALL_RAW" ]; then
    echo 'D: Collecting raw URLs:'
    pv -- latest.anno.jsonld | sed -re 's~http://~\n\a~g' \
      | tr '\\ ?"' '\n' | sed -nre 's~^\a~http://~p' \
      | LANG=C sort --version-sort | uniq --count \
      | gzip --best --stdout >"$ALL_RAW"
    echo 'D: Collection has been cached.'
  fi

  local UNK="$BFN.unknown.txt"
  >"$UNK" || return $?
  gzip --decompress --stdout -- "$ALL_RAW" | sed -re 's~^ *[0-9]+ ~~' \
    | sed -rf <(gen_url_prefix_ignores) \
    | sed -rf <(gen_url_prefix_upgrades) \
    | sed -re 's~^https://\S+~<run upgrader on dump!>~' \
    | LANG=C sort --version-sort | uniq --count \
    | sort --version-sort >"$UNK"

  if [ -s "$UNK" ]; then
    less -S -- "$UNK"
  else
    echo D: "$UNK is empty => looking good!"
  fi
}


function gen_url_prefix_ignores () {
  <<<"$PREFIXES_IGNORE" grep -oPe '\S+' | sed -rf <(echo '
      s~\.~\\&~g
      s%^%\\~%
      s!$!~d!
    ')
}


function gen_url_prefix_upgrades () {
  <<<"$PREFIXES_SSLIFY" grep -oPe '\S+' | sed -rf <(echo '
      s~\.~\\&~g
      s%^(http):%s~\(\1\)\(:%
      s!$!\)~\\1s\\2~g!
    ')
}


function upgrade () {
  pv --version >/dev/null || return 4$(echo "E: pv not found." \
    "Please install apt package pv (pipe progress viewer)." >&2)
  local ORIG="$1"
  local DEST="tmp.$$.upgraded.jsonld"
  local UPG="$(gen_url_prefix_upgrades)"
  echo "D: upgrade commands:"
  <<<"$UPG" nl -ba
  echo "Upgrade URLs from '$ORIG' -> '$DEST':"
  pv -- "$ORIG" | LANG=C sed -rf <(echo "$UPG") >"$DEST" || return $?
  du --human-readable -- "$DEST"
}




http_urls "$@"; exit $?
