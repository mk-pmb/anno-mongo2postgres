#!/bin/sh
# -*- coding: utf-8, tab-width: 2 -*-
sudo -Eu "$(stat -c %U .)" sh -c 'export TRAFO_MAXERR=100 SKIP_LINT=y; (
  ST="$(date -R)"
  echo "started: $ST. REWRITE_BASEURL is ‹$REWRITE_BASEURL›" \
    && ls -l -- latest.* \
    && npm run users \
    && npm run lrl dis \
    && npm run lrl pg \
    && npm run pu \
    && echo
  echo "started: $ST. REWRITE_BASEURL was ‹$REWRITE_BASEURL›"
  echo "done:    $(date -R)"
  )' 2>&1 | tee -- tmp.convert_latest.$(date +%y%m%d-%H%M).log; exit $?
