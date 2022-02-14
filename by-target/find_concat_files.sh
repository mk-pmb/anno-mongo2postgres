#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-
exec -- find -name "$@" -exec cat -- '{}' +; exit $?
