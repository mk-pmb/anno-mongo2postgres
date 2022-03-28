// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be.js';


const EX = function reviUrl(pop, key, info) {
  const {
    containerAnnoId,
    reviNum,
  } = info;
  mustBe.nest('containerAnnoId', containerAnnoId);
  const reviSuffix = (reviNum === undefined ? '' : '~' + reviNum);
  const suf = containerAnnoId + reviSuffix;
  pop.mustBe([['oneOf', [
    undefined,
    EX.annoBaseUrl + suf,
    EX.annoBaseUrl + 'anno/' + suf,
  ]]], key);
};


Object.assign(EX, {

  annoBaseUrl: 'https://anno.ub.uni-heidelberg.de/anno/',

});


export default EX;
