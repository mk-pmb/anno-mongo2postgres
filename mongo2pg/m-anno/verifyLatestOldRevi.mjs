// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';


const veri = function verifyLatestOldRevi(meta, topDataRevi, latestOldRevi) {
  if (!latestOldRevi) { return; }
  const metaMod = meta.dateLastModif;

  if (metaMod !== latestOldRevi.created) {
    const msg = ('Dates mismatch:'
      + '\nTop-level anno was last modified '
      + JSON.stringify(metaMod)
      + '\nbut latest revision was created  '
      + JSON.stringify(latestOldRevi.created));
    throw new Error(msg);
  }

  equal.named('Top-level data must match latest revision', () => {
    const expected = { ...topDataRevi, created: metaMod };
    delete expected.modified;
    equal(latestOldRevi, expected);
  });
};


export default veri;
