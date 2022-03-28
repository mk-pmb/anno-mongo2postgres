// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';
import getOwn from 'getown';


const EX = function expectSameCreator(ac, ex, job) {
  const cas = job.creatorAliases;
  if (cas && ex && ex.id && ac && ac.id) {
    if (ac.id === ex.id) { return; }
    let alias = getOwn(cas, ac.id);
    if (!alias) {
      const learn = job.hint('assumedCreatorAliases', undefined, {});
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
