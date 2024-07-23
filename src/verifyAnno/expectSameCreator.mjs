// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';
import getOwn from 'getown';


function isSingleElementArray(x) {
  return (Array.isArray(x) && (x.length === 1));
}


const EX = function expectSameCreator(ac, ex, job) {
  if (isSingleElementArray(ac)) { return EX(ac[0], ex, job); }
  if (isSingleElementArray(ex)) { return EX(ac, ex[0], job); }
  const cas = job.creatorAliases;
  if (cas && ex && ex.id && ac && ac.id) {
    if (ac.id === ex.id) { return; }
    let alias = getOwn(cas, ac.id);
    if (!alias) {
      const learn = job.hintDict('assumedCreatorAliases');
      alias = getOwn(learn, ac.id);
      if (!alias) {
        alias = ex.id;
        learn[ac.id] = alias;
      }
    }
    if (alias && (ex.id === alias)) {
      job.counters.add('usingCreatorAlias');
      job.counters.add('usingCreatorAlias:' + alias);
      return;
    }
  }
  equal(ac, ex);
};


export default EX;
