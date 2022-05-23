// -*- coding: utf-8, tab-width: 2 -*-

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

  annoBaseUrl: 'https://anno.ub.uni-heidelberg.de/anno/',

});


export default EX;
