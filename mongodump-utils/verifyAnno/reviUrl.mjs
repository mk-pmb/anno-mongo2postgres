// -*- coding: utf-8, tab-width: 2 -*-

import ubFacts from '../ubhd/facts.mjs';

const { annoBaseUrl } = ubFacts;


const EX = function reviUrl(anno, key, info) {
  const {
    reviNum,
  } = (info || false);
  const reviSuffix = (reviNum === undefined ? '' : '~' + reviNum);
  const suf = anno.divePath.expectedContainerAnnoId + reviSuffix;
  anno.api.popData.mustBe([['oneOf', [
    undefined,
    EX.annoBaseUrl + suf,
    EX.annoBaseUrl + 'anno/' + suf,
  ]]], key);
};


Object.assign(EX, {

  annoBaseUrl,

});


export default EX;
