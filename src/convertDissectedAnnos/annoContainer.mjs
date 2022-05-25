// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';


function annoContainer(job, anno) {
  // "Container" is a node that is not stored as a revision.

  // Does it have revisions?
  const { nv } = anno.disMeta;
  if (nv) {
    // We hope that its annotation data is the same as its latest revision:
    job.assume('sameDataAsLatestRevision:' + anno.recId);
    // We'll verify that later when we encounter the actual latest revision.
    return;
  }

  equal(nv, 0);
  throw new Error(':TODO: Insert container as its latest revision.');
}


export default annoContainer;
