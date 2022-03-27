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


const conv = {
  annoCache: {},
  hotfixes: {},
  creatorAliases: {},

  annoContainer,
  annoRevision,
  eachToplevelRecord,
  fmtInserts,
  optimizeReviDetails,
  parseDivePath,
};

const trafoPr = trafoCli(conv);

export default trafoPr;
