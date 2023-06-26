// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be.js';

const actualMongoIdField = '_id';

function defaultChecks(rec) {
  if (!rec) { throw new TypeError('False-y record'); }
  if (rec[actualMongoIdField]) {
    throw new Error('Using option fakeMongoId but found actual mongo ID!');
  }
}


const EX = {

  idSlug(rec) {
    defaultChecks(rec);
    return mustBe.nest(rec.id, 'Anno ID').split('/').slice(-1)[0];
  },

};



export default EX;
