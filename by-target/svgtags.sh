#!/bin/sh
# -*- coding: utf-8, tab-width: 2 -*-
zcat -- tmp.pg.anno_data.sql.gz | grep -oPe '<svg.*?</svg>' \
  | grep -oPe '<\w+' | sort | uniq -c | sort -rg; exit $?
