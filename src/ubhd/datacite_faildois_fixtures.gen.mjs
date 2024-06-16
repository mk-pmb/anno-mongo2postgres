// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import fs from 'fs/promises';

import fix from './fixBodies.mjs';

function makeLogger(p) { return console.log.bind(console, p); }


(async function main() {
  let annos = (await import('./datacite_faildois_fixtures.input.json')).default;
  const jobStub = {
    counters: { add: makeLogger('add') },
    assume: makeLogger('assume'),
  };
  annos = annos.map(function each(a) {
    const body = fix(a.id, a.body, jobStub);
    console.debug(JSON.stringify(body, null, 2));
    return { ...a, body };
  });
  annos = JSON.stringify(annos, null, 2) + '\n';
  const save = 'tmp.datacite_faildois_fixtures.json';
  await fs.writeFile(save, annos, 'UTF-8');
  console.info('Saved to:', save);
}());
