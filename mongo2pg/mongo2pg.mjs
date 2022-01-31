// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import getStdin from 'get-stdin';
// import getOwn from 'getown';

import flattenAndPrint from './flattenAndPrint.mjs';


const tlaSkip = (+process.env.TLA_SKIP || 0);
const tlaLimit = (+process.env.TLA_LIMIT || 10);


// const ignoreUnusedVar = Boolean;


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
    try {
      flattenAndPrint.oneTopAnno(anno);
    } catch (flapErr) {
      flapErr.message = '@[idx=' + idx + '] ' + flapErr.message;
      throw flapErr;
    }
  });
  console.log('null ]');
  console.error({ done: nSliced, progress: 1 });
}


cliMain();
