// -*- coding: utf-8, tab-width: 2 -*-


const EX = async function optimizeReviDetails(anno, job) {
  const { data } = anno;
  data.created = anno.meta.time_created;
  const title = String(data['dc:title'] || data.title || '').trim();
  delete data.title;
  if (title) { data['dc:title'] = title; }
  EX.maybeConvertLegacyDoi(anno, job);
};


EX.diglitBaseUrl = 'https://digi.ub.uni-heidelberg.de/diglit/';
EX.annoTestBaseUrl = EX.diglitBaseUrl + 'annotationen_test/';


Object.assign(EX, {

  maybeConvertLegacyDoi(anno, job) {
    const { recId, meta } = anno;
    const { unverifiedDoi } = meta;
    delete meta.unverifiedDoi;

    meta.debug_doi_verified = null;
    // ^- must always be set because all records in a table must have
    //    the same fields.

    if (!unverifiedDoi) { return; }
    const subjTgtUrl = anno.relations.subject;
    if (subjTgtUrl.startsWith(EX.annoTestBaseUrl)) { return; }

    const okAssu = job.assume('legacyDoi:verified:' + recId);
    okAssu.assumedByOptim = unverifiedDoi;
    okAssu.subjTgt = subjTgtUrl;
    const okDoi = okAssu.reviDoi;
    meta.debug_doi_verified = okDoi;
    if (unverifiedDoi === okDoi) {
      const { relations } = anno;
      relations.doi = job.doiUriPrefix + okDoi;
      job.assume('legacyDoi:converted:' + recId, { confirmed: true });
      job.counters.add('legacyDoi:converted');
      return;
    }
    console.warn('Omit unverified legacy DOI @', recId);
    job.counters.add('legacyDoi:omitUnverified');
  },



});




export default EX;
