// -*- coding: utf-8, tab-width: 2 -*-

import getStdin from 'get-stdin';

const rr = async function readRelaxedJsonFromStdin(opt) {
  if (!opt) { return rr({}); }
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
  if (Array.isArray(data) && (data.slice(-1)[0] === null)) { data.pop(); }
  console.error('Number of top-level records in input:', data.length);

  const tlrOffset = (+opt.offset || 0);
  const tlrLimit = (+opt.limit || 1000);
  data = data.slice(tlrOffset, tlrOffset + tlrLimit);
  const nSliced = data.length;
  console.error('Number of top-level records after slicing:', nSliced);

  data.offset = tlrOffset;
  return data;
};


export default rr;
