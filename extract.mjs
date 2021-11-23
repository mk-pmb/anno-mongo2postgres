// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import fullDump from './dump-latest.array.json';


const usc = '_';
let remain = 5;

const wantIds = [
  '54eb5a09-df9f-3f1c-b18e-4676d1046166',
  'XXawQjKoQyiJgLL-bh_CIQ',
];


function decide(rec) {
  const want = wantIds.includes(rec[usc + 'id']);
  return want;
}


function limiter(rec) {
  if (remain < 1) { return; }
  if (!decide(rec)) { return; }
  remain -= 1;
  return true;
}


const found = fullDump.filter(limiter);
console.warn('Found %s record(s).', found.length);
console.log(JSON.stringify(found, null, 2));
