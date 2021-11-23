// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import getStdin from 'get-stdin';
// import getOwn from 'getown';
import objPop from 'objpop';
import mustBe from 'typechecks-pmb/must-be.js';
import equal from 'equal-pmb';

// import revisionsProps from './node_modules/@/anno-viewer/revisionsProps.js';
const revisionsProps = [
  'body',
  'created',
  'doi',
  'modified',
  'target',
  'title',
];

const tlaSkip = (+process.env.TLA_SKIP || 0);
const tlaLimit = (+process.env.TLA_LIMIT || 100);


const copyToplevelProps = [
  'canonical',
  'collection',
  'rights',
  'via',
];


const ignoreRevisionKeysEqualToAnno = [
  'canonical',
  'collection',
  'creator',
  'rights',
  'via',
];


// const ignoreUnusedVar = Boolean;


function popUselessAnnoProps(pop) {
  pop.mustBe([['oneOf', 'Annotation']], 'type');
}


function popUselessRevisionProps(pop) {
  popUselessAnnoProps(pop);
  pop.mustBe('undef | str', '_lastCommented');
  pop.mustBe('undef | str', 'modified');
}


function popRevisionKeys(pop) {
  const d = {};
  revisionsProps.forEach(function c(k) {
    const v = pop(k);
    if (v !== undefined) { d[k] = v; }
  });
  return d;
}


function previewOrDeleteErrorProp(trace, report) {
  const err = report.ERROR;
  if (err) {
    console.error('%s:', trace.func, err);
    const { hint } = trace;
    console.error("  ^-- offending anno's %s:", hint,
      trace.detail || report[hint]);
  } else {
    delete report.ERROR; // eslint-disable-line no-param-reassign
  }
}


const flattenAndPrint = {

  oneTopAnno(origTopAnno) {
    flattenAndPrint.oneAnno(origTopAnno, []);
  },

  oneAnno(origAnno, parents) {
    const popOrigAnno = objPop(origAnno, { mustBe });
    const replies = popOrigAnno('_replies');
    popUselessAnnoProps(popOrigAnno);
    const meta = flattenAndPrint.popMeta(popOrigAnno);
    const topDataRevi = popRevisionKeys(popOrigAnno);
    const origOldRevis = [].concat(popOrigAnno('_revisions')).filter(Boolean);
    const oldRevis = origOldRevis.map(function chkOld(r) {
      return flattenAndPrint.checkOldRevision(r, meta, origAnno);
    });

    let flat = {
      ERROR: null,
      meta,
      topDataRevi,
    };
    const latestOldRevi = oldRevis.pop();
    const nRevis = oldRevis.length;
    if (nRevis) { Object.assign(flat, { nRevis, oldRevis }); }

    try {
      popOrigAnno.expectEmpty();
      flattenAndPrint.verifyLatestOldRevi(meta, topDataRevi, latestOldRevi);
    } catch (err) {
      flat.ERROR = String(err);
    }
    previewOrDeleteErrorProp({ func: 'oneAnno', hint: 'meta' }, flat);

    flat = JSON.stringify(flat, null, 2);
    flat = flat.replace(/^\{\s+/, '{ ');
    flat += ',';
    console.log(flat);

    if ((replies || false).length) {
      if (parents.length > 4) {
        console.error('Parents:', parents);
        throw new RangeError('Annotation nested too deeply!');
      }
      const subParents = [...parents, meta];
      replies.forEach(sub => flattenAndPrint.oneAnno(sub, subParents));
    }
  },

  popMeta(pop) {
    const meta = {
      mongoId: pop('_id', null),
      annotId: pop('id', null),
      createdby: pop('creator', null),
      dateCreated: pop('created', null),
      dateLastCommented: pop('_lastCommented', null),
    };
    meta.dateLastModif = pop('modified', meta.dateCreated);
    copyToplevelProps.forEach(function c(k) { meta[k] = pop(k, null); });
    return meta;
  },

  checkOldRevision(origRevi, meta, parentOrigAnno) {
    const popOrigRevi = objPop(origRevi, { mustBe });
    popUselessRevisionProps(popOrigRevi);
    const revi = { ERROR: null, ...popRevisionKeys(popOrigRevi) };
    ignoreRevisionKeysEqualToAnno.forEach(function ign(key) {
      const val = origRevi[key];
      if (val === undefined) { return; }
      try {
        equal(val, parentOrigAnno[key]);
        popOrigRevi(key);
      } finally {
        Boolean('no-op');
      }
    });
    try {
      popOrigRevi.expectEmpty();
    } catch (err) {
      revi.ERROR = String(err);
    }
    previewOrDeleteErrorProp({
      func: 'checkOldRevision:',
      hint: 'parent meta',
      detail: meta,
    }, revi);
    return revi;
  },

  verifyLatestOldRevi(meta, topDataRevi, latestOldRevi) {
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
  },

};


async function cliMain() {
  console.error('Reading from stdin:');
  let data = await getStdin();
  console.error('Done, got %s characters.', data.length);

  console.error('Decoding…');
  data = data.trim();
  if (!data.startsWith('[')) { data = '[' + data + '\n]'; }
  data = data.replace(/\s+(?=\n)/g, '');
  data = data.replace(/(\})(\n\s*\{)/g, '$1,$2');

  console.error('Parsing…');
  data = JSON.parse(data);
  console.error('Number of top-level annos in input:', data.length);
  data = data.slice(tlaSkip, tlaSkip + tlaLimit);
  const nSliced = data.length;
  console.error('Number of top-level annos after slicing:', nSliced);

  console.log('[');
  [].concat(data).forEach(function topLevelAnno(anno, idx) {
    console.error({ idx, progress: idx / nSliced });
    flattenAndPrint.oneTopAnno(anno);
  });
  console.log('null ]');
  console.error({ done: nSliced, progress: 1 });
}


cliMain();
