// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';
import mustBe from 'typechecks-pmb/must-be.js';
import vTry from 'vtry';

import expectSameBodies from './expectSameBodies.mjs';
import expectSameCreator from './expectSameCreator.mjs';


const namedEqual = equal.named.deepStrictEqual;


const EX = function expectHasAllTheContentsFrom(allKnownContent, excerpt, job) {
  mustBe('nonEmpty obj', 'allKnownContent')(allKnownContent);
  mustBe('nonEmpty obj', 'excerpt')(excerpt);
  const missingFields = { ...allKnownContent };
  EX.ignoreMissingReviKeys.forEach(k => delete missingFields[k]);

  Object.entries(excerpt).forEach(function verify([key, val]) {
    if (val === undefined) { return; }
    delete missingFields[key];
    const want = allKnownContent[key];
    const explain = ("Excerpt property '" + key
      + "' (+) differs from expectation (-)");
    if (key === 'body') {
      return vTry(expectSameBodies, explain)(val, want);
    }
    if (key === 'creator') {
      return vTry(expectSameCreator, explain)(val, want, job);
    }
    namedEqual(explain, val, want);
  });
  mustBe('empty', 'missing fields in revision')(Object.keys(missingFields));
};


EX.ignoreMissingReviKeys = [
  '_lastReplied',
  '@context',
  'collection',
  'doi',
  'id',
  'modified',
  'via', // old mongo format abuses this for as:inReplyTo.
];


export default EX;
