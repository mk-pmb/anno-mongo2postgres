// -*- coding: utf-8, tab-width: 2 -*-

import isStr from 'is-string';


const EX = function makeUrlPrefixesFilter() {
  const f = function decide(s) {
    if (!s) { return false; }
    if (!isStr(s)) { return false; }
    const a = f.acceptablePrefixes;
    if (!a.size) { return f.ifEmpty; }
    let ok = false;
    a.forEach(function check(p) {
      if (ok) { return; }
      if (s.startsWith(p)) { ok = true; }
    });
    return ok;
  };
  Object.assign(f, EX.api);
  f.acceptablePrefixes = new Set();
  return f;
};


EX.api = {

  ifEmpty: true,

  addPrefixes(list) {
    const a = this.acceptablePrefixes;
    Array.from(list).forEach(p => (p && a.add(p)));
  },

};


export default EX;
