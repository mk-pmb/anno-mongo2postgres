// -*- coding: utf-8, tab-width: 2 -*-

function countIdFormats(job, id) {
  const fmts = Object.entries(job.idFormatRegExps)
    .map(([k, rx]) => (rx.test(id) && k)).filter(Boolean);
  if (fmts.length < 1) { throw new Error('Unknown ID format'); }
  if (fmts.length > 1) {
    const msg = ('ID matches too many known formats: ' + fmts.join(', '));
    throw new Error(msg);
  }
  job.counters.add('idFmt:' + fmts[0]);
}


export default countIdFormats;
