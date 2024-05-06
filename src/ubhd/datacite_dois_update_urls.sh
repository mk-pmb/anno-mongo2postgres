#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function datacite_dois_update_urls () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH" || return $?

  eval local -A FACTS=( $(
    sed -nre 's~,$~~;s~^\s*([A-Za-z]+): ~[\1]=~p' -- facts.mjs) )
  local PRFX="${FACTS[digiDoi]}"
  local DOIS_LIST='tmp.doiPartToVersId.json'
  local TODO=()
  readarray -t TODO < <(
    sed -nre 's~^"([^"]+)": "([^"]+)",$~\1 \2~p' -- "$DOIS_LIST")
  local N_DOIS="${#TODO[@]}"
  local COOLDOWN="${COOLDOWN:-2}"
  echo D: "Found $N_DOIS DOIs in '$DOIS_LIST'." \
    "API cooldown is $COOLDOWN seconds => Updates will take about $((
      ( ( ( N_DOIS * COOLDOWN ) + N_DOIS ) / 60 ) + 1 )) minutes."

  [ -n "$REDIR" ] || local REDIR='https://anno.ub.uni-heidelberg.de/anno/'
  echo D: "Redirect URLs will be set to $REDIR<id> (set REDIR=… to change)"
  echo D: "Preview: https://doi.org/$PRFX${TODO[0]%% *} -> $REDIR${TODO[0]##* }"

  local DC_USER="$DC_USER" DC_PSWD="$DC_PSWD"
  [ -n "$DC_USER" ] || read -rp 'DataCite username: ' DC_USER || return $?
  [ -n "$DC_PSWD" ] || read -rsp 'DataCite password: ' DC_PSWD || return $?
  echo
  local NUM=0 DOI= URL=
  for DOI in "${TODO[@]}"; do
    URL="$REDIR${DOI##* }"
    DOI="$PRFX${DOI%% *}"
    (( NUM += 1 ))
    echo -n "#$NUM/$N_DOIS:"$'\t'"$DOI"$'\t'"-> $URL"$'\t: '
    update_one_doi_url || return $?
  done
}


function update_one_doi_url () {
  local META='{"data":{"type":"dois","attributes":{"doi":"=","url":"="}}}'
  META="${META/=/$DOI}"
  META="${META/=/$URL}"
  local OPT=(
    --user "$DC_USER:$DC_PSWD"
    --silent
    --request PUT
    --header 'Content-Type: application/vnd.api+json'
    --data '@-'
    -- "https://${FACTS[dataCiteApiHost]}/dois/$DOI"
    )
  local DC_REPLY="$(<<<"$META" curl "${OPT[@]}")"
  [[ "$DC_REPLY" == *'"attributes":{"doi":"'"$DOI"'"'* ]] || return 4$(
    echo E: 'API reply does not show the proper DOI.' >&2)
  [[ "$DC_REPLY" == *'"url":"'"$URL"'"'* ]] || return 4$(
    echo E: 'API reply does not show the proper redirect URL.' >&2)
  echo 'updated. API cooldown.'
  sleep "$COOLDOWN"s
}



datacite_dois_update_urls "$@"; exit $?
