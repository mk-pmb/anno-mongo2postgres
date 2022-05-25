// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';
import vTry from 'vtry';


const namedEqual = equal.named.deepStrictEqual;


const EX = function expectSameBodies(origAc, origEx) {
  const acs = [].concat(origAc);
  const exs = [].concat(origEx);
  namedEqual('Number of body parts', acs.length, exs.length);

  function cmpPart(ac, ex) {
    const act = (ac && typeof ac);
    if (act !== 'object') { return equal(ac, ex); }
    namedEqual('type', act, (ex && typeof ex));
    namedEqual('everything except value',
      { ...ac, value: null },
      { ...ex, value: null });
    namedEqual('value', ac.value, ex.value);
  }

  acs.forEach(function cmpEach(ac, idx) {
    vTry(cmpPart, 'body[' + idx + ']')(ac, exs[idx]);
  });
};


export default EX;
