// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import equal from 'equal-pmb';
import msecToHumanDuration from 'pretty-ms';


function jsonDeepCopy(orig) {
  const copy = JSON.parse(JSON.stringify(orig));
  equal.named('jsonDeepCopy was lossless',
    function verifyJsonDeepCopyLossless() { equal(copy, orig); });
  return copy;
}


function dateDump(raw, parsed) {
  return (JSON.stringify(raw) + ', parsed: ' + parsed);
}


function checkCreationDate(topAnnoMeta, latestOldRevi, dropProp) {
  const latestCreatedOrig = latestOldRevi.created;
  const topLastModif = topAnnoMeta.dateLastModif;
  if (topLastModif === latestCreatedOrig) { return; }
  const dateModif = new Date(topLastModif);
  const dateCreated = new Date(latestCreatedOrig);
  const modifDeltaMsec = (dateModif - dateCreated);
  const modifAfterCreated = (modifDeltaMsec >= 0);

  const msg = ('Dates mismatch: Latest revision was'
    + '\ncreated  ' + dateDump(latestCreatedOrig, dateCreated)
    + ' but parent anno was last'
    + '\nmodified ' + dateDump(topLastModif, dateModif)
    + ', i.e. ' + msecToHumanDuration(Math.abs(modifDeltaMsec || 0))
    + ' ' + (modifAfterCreated ? 'after' : 'BEFORE') + ' creation.');
  if (modifAfterCreated) {
    console.warn('W: %s', msg);
    dropProp('created');
    return;
  }

  throw new Error(msg);
}


const veri = function verifyLatestOldRevi(params) {
  const {
    latestOldRevi,
    topAnnoMeta,
    topReviData,
    cliState,
  } = params;

  if (!latestOldRevi) { return; }
  const expected = {
    ...topReviData,
    created: topAnnoMeta.dateLastModif,
  };
  delete expected.modified;

  const relaxedLatestOldRevi = {
    created: topAnnoMeta.dateCreated,
    ...jsonDeepCopy(latestOldRevi),
  };

  function dropProp(key) {
    delete relaxedLatestOldRevi[key];
    delete expected[key];
  }

  checkCreationDate(topAnnoMeta, relaxedLatestOldRevi, dropProp);

  equal.named('Top-level data must match latest revision',
    function mustMatchLatestRevi() { equal(relaxedLatestOldRevi, expected); });
};


export default veri;
