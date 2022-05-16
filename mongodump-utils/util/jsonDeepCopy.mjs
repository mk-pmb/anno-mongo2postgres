// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';

const namedEqual = equal.named.deepStrictEqual;

const EX = function jsonDeepCopy(x) {
  const c = JSON.parse(JSON.stringify(x));
  namedEqual('jsonDeepCopy', c, x);
  return c;
};

export default EX;
