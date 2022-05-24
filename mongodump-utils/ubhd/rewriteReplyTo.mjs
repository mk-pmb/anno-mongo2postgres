// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';
import mustBe from 'typechecks-pmb/must-be.js';
import objPop from 'objpop';

import ubFacts from './facts.mjs';


const namedEqual = equal.named.deepStrictEqual;
const { annoBaseUrl } = ubFacts;



const EX = function rewriteReplyTo(anno, job) {
  const { data, relations } = anno;
  const { replyTo } = data;
  delete data.replyTo;
  if (!replyTo) { return; }

  const caid = anno.divePath.expectedContainerAnnoId;
  const parentAnnoId = caid.replace(/\.\d+$/, '');
  const parentAnnoUrlAbs = annoBaseUrl + 'anno/' + parentAnnoId;
  const parentAnnoUrlRel = parentAnnoId;

  namedEqual('original replyTo', replyTo, parentAnnoUrlAbs);
  mustBe.prop(data, [['oneOf', [
    undefined,
    'replying',
  ]]], 'purpose');

  const [origTgt] = mustBe('ary ofLength:1', 'original targets list')(
    [].concat(data.target));
  mustBe('obj', 'original first target')(origTgt);
  const popTgt = objPop(origTgt, { mustBe }).mustBe;
  const origScope = job.modernizeUrl(popTgt('nonEmpty str | undef', 'scope'));
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
  data.target = { id: parentAnnoUrlRel };
  if (origScope) { data.target.scope = origScope; }
  data['as:inReplyTo'] = parentAnnoUrlRel;
  relations.inReplyTo = parentAnnoUrlRel;
};


export default EX;
