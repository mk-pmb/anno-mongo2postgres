// -*- coding: utf-8, tab-width: 2 -*-


const EX = async function optimizeReviDetails(anno, job) {
  const { data } = anno;
  data.title = String(data.title || '').trim();
  EX.maybeConvertLegacyDoi(anno, job);
};


Object.assign(EX, {

  maybeConvertLegacyDoi(anno, job) {
    const { recId, meta, data } = anno;
    const { doi } = anno.meta;

    meta.debug_doi_verified = null;
    // ^- must always be set because all records in a table must have
    //    the same fields.

    if (!doi) { return; }
    const okAssu = job.assume('legacyDoi:verified:' + recId);
    okAssu.assumedByOptim = doi;
    okAssu.subjTgt = anno.relations.subject;
    const okDoi = okAssu.reviDoi;
    meta.debug_doi_verified = okDoi;
    if (doi === okDoi) {
      const { relations } = anno;
      data['dc:identifier'] = job.doiUriPrefix + doi;
      relations.doi = doi;
      job.assume('legacyDoi:converted:' + recId, { confirmed: true });
      job.counters.add('legacyDoi:converted');
      return;
    }
    console.warn('Omit unverified legacy DOI @', recId);
    job.counters.add('legacyDoi:omitUnverified');
  },



});




export default EX;
