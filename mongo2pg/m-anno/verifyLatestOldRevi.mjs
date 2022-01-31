// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';
import msecToHumanDuration from 'pretty-ms';


function jsonDeepCopy(orig) {
  const copy = JSON.parse(JSON.stringify(orig));
  equal.named('jsonDeepCopy was lossless', () => equal(copy, orig));
  return copy;
}


function dateDump(raw, parsed) {
  return (JSON.stringify(raw) + ', parsed: ' + parsed);
}


function checkCreationDate(metaMod, latestOldRevi, dropProp) {
  const latestCreatedOrig = latestOldRevi.created;
  if (metaMod === latestCreatedOrig) { return; }
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
  if (modifAfterCreated) {
    // console.warn('W: %s', msg);
    dropProp('created');
    return;
  }

  throw new Error(msg);
}


const veri = function verifyLatestOldRevi(meta, topDataRevi, latestOldRevi) {
  if (!latestOldRevi) { return; }
  const metaMod = meta.dateLastModif;
  const expected = { ...topDataRevi, created: metaMod };
  delete expected.modified;

  const relaxedLatestOldRevi = jsonDeepCopy(latestOldRevi);

  function dropProp(key) {
    delete relaxedLatestOldRevi[key];
    delete expected[key];
  }

  checkCreationDate(metaMod, latestOldRevi, dropProp);

  equal.named('Top-level data must match latest revision', () => {
    equal(relaxedLatestOldRevi, expected);
  });
};


export default veri;
