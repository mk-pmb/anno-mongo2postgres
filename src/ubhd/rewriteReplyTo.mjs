// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';
import mustBe from 'typechecks-pmb/must-be.js';
import objPop from 'objpop';

import ubFacts from './facts.mjs';


const namedEqual = equal.named.deepStrictEqual;
const { annoBaseUrl } = ubFacts;



const EX = function rewriteReplyTo(anno) {
  const {
    divePath,
    data,
    relations,
  } = anno;

  const parentAnnoId = EX.findParentAnnoId(anno);
  const parentAnnoUrlRel = parentAnnoId;
  const parentAnnoUrlAbs = annoBaseUrl + 'anno/' + parentAnnoId;

  anno.api.popData([['oneOf', [
    undefined,
    parentAnnoUrlAbs,
  ]]], 'replyTo');
  if (!divePath.commentDepth) { return; }

  mustBe.prop(data, [['oneOf', [
    undefined,
    'replying',
  ]]], 'purpose');
  mustBe.tProp('body', data.body, [['oneOf', [
    undefined,
    'replying',
  ]]], 'motivation');

  const [origTgt] = mustBe('ary ofLength:1', 'original targets list')(
    [].concat(data.target));
  mustBe('obj', 'original first target')(origTgt);
  const popTgt = objPop(origTgt, { mustBe }).mustBe;
  const origScope = popTgt('nonEmpty str', 'scope');
  namedEqual('original scope URL', origScope, relations.subject);
  const origTgtSel = popTgt('obj | undef', 'selector');
  if (origTgtSel) {
    const origTgtSrc = popTgt('nonEmpty str', 'source');
    namedEqual('original target source', origTgtSrc, origScope + '/_image');
  } else {
    const origTgtUrl = popTgt('nonEmpty str', 'id');
    namedEqual('original target URL', origTgtUrl, parentAnnoUrlAbs);
  }
  popTgt.expectEmpty();

  delete data.purpose;
  const updates = {
    'as:inReplyTo': [parentAnnoUrlAbs],
    target: [{ id: parentAnnoUrlAbs, scope: origScope }, origTgt],
    motivation: ['replying'],
  };
  Object.assign(data, updates);
  relations.inReplyTo = parentAnnoUrlRel;
  // console.debug(divePath.expectedContainerAnnoId, divePath.str,
  //   'rel:', relations, 'upd:', updates);
};


Object.assign(EX, {

  findParentAnnoId(anno) {
    const caid = anno.divePath.expectedContainerAnnoId;
    const { recId } = anno;
    if (recId === 'Cd6tRIwaThmpMnetnDqJKQ>dp-cv-0-0') { return caid; }
    return caid.replace(/\.\d+$/, '');
  },

});


export default EX;
