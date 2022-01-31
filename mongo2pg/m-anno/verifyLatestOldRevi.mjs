// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';
import msecToHumanDuration from 'pretty-ms';


function dateDump(raw, parsed) {
  return (JSON.stringify(raw) + ', parsed: ' + parsed);
}


const veri = function verifyLatestOldRevi(meta, topDataRevi, latestOldRevi) {
  if (!latestOldRevi) { return; }
  const metaMod = meta.dateLastModif;
  const latestCreatedOrig = latestOldRevi.created;

  if (metaMod !== latestCreatedOrig) {
    const dateModif = new Date(metaMod);
    const dateCreated = new Date(latestCreatedOrig);
    const modifDeltaMsec = (dateModif - dateCreated);
    const modifAfterCreated = (modifDeltaMsec >= 0);
    const msg = ('Dates mismatch: Latest revision was'
      + '\ncreated  ' + dateDump(latestCreatedOrig, dateCreated)
      + ' but parent anno was last'
      + '\nmodified ' + dateDump(metaMod, dateModif)
      + ', i.e. ' + msecToHumanDuration(Math.abs(modifDeltaMsec))
      + ' ' + (modifAfterCreated ? 'after' : 'BEFORE') + ' creation.');
    throw new Error(msg);
  }

  equal.named('Top-level data must match latest revision', () => {
    const expected = { ...topDataRevi, created: metaMod };
    delete expected.modified;
    equal(latestOldRevi, expected);
  });
};


export default veri;
