// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import documentGroupsToplist from './documentGroupsToplist.mjs';
import fullDump from './dump-latest.array.json';

const inspectValuesOf = [
  '@context',
];

const ignoreKeys = [
  '@context="http://www.w3.org/ns/anno.jsonld"',
];

const expectedKeys = [
  '_id',
  '_replies',
  '_revisions',
  'body',
  'collection',
  'created',
  'creator',
  'id',
  'modified',
  'rights',
  'target',
  'title',
  'type',
];

documentGroupsToplist(fullDump, function grouper(docData) {
  const unexpectedKeys = new Set(Object.keys(docData));
  const report = [];

  inspectValuesOf.forEach(function maybeInspectValue(key) {
    unexpectedKeys.delete(key);
    const val = docData[key];
    if (val === undefined) { return; }
    unexpectedKeys.add(key + '=' + JSON.stringify(val));
  });

  ignoreKeys.forEach(key => unexpectedKeys.delete(key));

  expectedKeys.forEach((k) => {
    if (unexpectedKeys.has(k)) {
      unexpectedKeys.delete(k);
    } else {
      report.push(k + '¬');
    }
  });

  Array.from(unexpectedKeys).map(k => report.push(k));
  const glued = report.sort().join(' ');
  return (glued || ('as expected = ' + expectedKeys.join(' ')));
});
