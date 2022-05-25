// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import trafoCli from '../trafoCli.mjs';

import annoContainer from './annoContainer.mjs';
import annoRevision from './annoRevision.mjs';
import eachToplevelRecord from './eachToplevelRecord.mjs';
import fmtInserts from './fmtInserts.mjs';
import optimizeReviDetails from './optimizeReviDetails.mjs';
import parseDivePath from './parseDivePath.mjs';


const idFormatRegExps = {
  uuid: /^[0-9a-f]{8}(?:\-[0-9a-f]{4}){3}-[0-9a-f]{12}$/,
};


const conv = {
  annoCache: {},
  creatorAliases: {},
  hotfixes: {},
  idFormatRegExps,

  annoContainer,
  annoRevision,
  eachToplevelRecord,
  fmtInserts,
  optimizeReviDetails,
  parseDivePath,

  doiUriPrefix: 'https://doi.org/',
  // ^- NB: The urn:doi: namespace was _not_ registered.

  async cliCleanup(job) {
    fmtInserts.endAll(job);
  },
};

const trafoPr = trafoCli(conv);

export default trafoPr;
