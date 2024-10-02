#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function stichproben () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH" || return $?

  local ANNOS=(
    # 'cpg148/0074/09a70a00f6719'

    'boerner1937_06_19/0006/GhAU4GUnSQiGu_FX_-wnIg'
    'boerner1938_05_25/0006/dBFLggOQSXeS0RD6PVFIBA'
    'boerner1939_04_28/0008/DNr-StheR-eTsdLwFpmcCA'
    'boerner1943_03_30/0006/Vg4BKIGFQyaNxtkXWE24FA'
    'braun1924bd1/0238/AKhB1XIyTCGjxPvtw7JEIA'
    'cpg354/0099/UeEu4x7oRu6oZTxpuRMESQ'
    'cpgraec23/0079/cr8_EleVRjKsUzu9Dx7OOA'
    'fischer1942_03_19/0002/Ll-D_xMwRQ6dUrdLnBmfFA'
    'gloeckner1933bd2/0234/001db1cbf0'
    'helbing1937_05_11/0006/J8NvU7kyTH6GB1zsVKuO7A'
    'karl_und_faber1944_05_05/0013/aSRhkIM7SfyuAsH9v3Q1Vg'
    'lange1942_05_12/0005/XaBxvpjHSiSLRvfTQLdhUg'
    'lange1943_04_16a/0006/F-f3xh-TR--zq3x7XX2v1w'
    'lange1943_10_06/0073/Vc0n9qO2RRG65GDARRy6Ng'
    'lepke1936_05_06/0005/JhTAtRbrSOib9OJERGptUg'
    'lepke1937_04_09/0006/B-PspN0hTzmI1boaQawGzA'

    'cpgraec23/0204/cPnSOKkORUOLsKht0VQdWA' # ~1 und ~2: 100% gleich?
    'perl1935_12_06/0104/bhfAp_IkSrmw6ytj3MMJlQ' # ~2: <h2><br></h2>
    'perl1937_03_18/0004/Cd6tRIwaThmpMnetnDqJKQ' # dp-cvv-0-0-0 (einzige cvv)
    'vollmer1915/0009/Tp28vHlXTUKIRFZ__LlSqQ' # ~1, ~2 und ~3: 100% gleich?

    # 'UL9bSMsbQwu8rBaZO5HrqA' # "Keramik <Technik>" d-nb:gnd:4030271-4
    'NtWgKL9aTQ60Eqfxsw3N5w' # "Zylinder <Kopfbedeckung>" d-nb:gnd:4373143-0

    )
  local ANUB='https://anno.ub.uni-heidelberg.de/anno/'
  local DIGI='https://digi.ub.uni-heidelberg.de/diglit/'
  local LHF="http://localhost:33380/anno-frontend/test/html/$(
    )displayAnnotations.nm.html?cmp1="
  local HCDA='https://servhc42.ub.uni-heidelberg.de/diglit/anno/'
  local URL= VAL=
  for ANNO in "${ANNOS[@]}"; do
    sleep 1s
    # gtame wafo "$LHF${ANNO##*/}"
    # gtame ffox "$HCDA${ANNO##*/}"
    echo "$ANUB${ANNO##*/}"
    # echo "$DIGI$ANNO"
    continue

    URL="https://servhc42.ub.uni-heidelberg.de/diglit/$ANNO/image,info"
    VAL="$(curl --silent -- "$URL" | grep -Fe 'Book not found')"
    if [ -n "$VAL" ]; then
      <<<"$VAL @ $ANNO" sed -re 's~<[^<>]*>~~g'
      continue
    fi
    echo "Browsing $URL"
    ffox "$URL"
  done
}








[ "$1" == --lib ] && return 0; stichproben "$@"; exit $?
