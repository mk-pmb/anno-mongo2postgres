// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import fs from 'fs';
import mustBe from 'typechecks-pmb/must-be.js';

import ubFacts from '../facts.mjs';


const oldBaseUrl = 'https://anno.ub.uni-heidelberg.de/anno/anno/';

function toJson(x) { return JSON.stringify(x, null, 1).replace(/\n */g, ' '); }

async function runFromCLI() {
  const allDoisData = (await import('./dc-export-all.json')).default.data;
  const sortedLists = {
    lineageIds: new Set(),
    redirTargetIdParts: new Set(),
  };
  const jsonReports = {
    versIdToDoiPart: {},
    doiPartToVersId: {},
  };
  allDoisData.forEach((rec) => {
    const attr = rec.attributes;
    const {
      doi, // e.g. "10.11588/anno.diglit.j8nvu7kyth6gb1zsvkuo7a_1"
      url, // e.g. "https://anno.ub.uni-heidelberg.de/anno/anno/J8NvU7kyTH6GB1zsVKuO7A~1"
      // ...otherKeys
    } = attr;
    const trace = 'DOI ' + doi + ' ';
    const lcDoiAnnoVersId = mustBe.nest(trace + 'anno version ID in DOI',
      doi.split(ubFacts.digiDoi)[1]);
    mustBe.eeq(lcDoiAnnoVersId, 'verify lower-case')(
      lcDoiAnnoVersId.toLowerCase());

    const verify = mustBe.tProp(trace + 'attribute ', attr);
    verify('eeq:"findable"', 'state');
    verify('eeq:null', 'contentUrl');
    verify('eeq:null', 'published');
    verify('eeq:null', 'reason');
    verify('eeq:null', 'version');
    verify('eeq:true', 'isActive');

    // verify('eeq:"2024-04-09T15:27:41Z"',  'created');
    // verify('eeq:"2024-04-09T15:27:42Z"',  'registered');
    // verify('eeq:"2024-04-09T15:27:42Z"',  'updated');

    const redirUrlIdPart = url.split(oldBaseUrl)[1];
    jsonReports.versIdToDoiPart[redirUrlIdPart] = lcDoiAnnoVersId;
    jsonReports.doiPartToVersId[lcDoiAnnoVersId] = redirUrlIdPart;
    const lcRedirUrlIdPart = redirUrlIdPart.toLowerCase();
    if (lcRedirUrlIdPart !== lcDoiAnnoVersId) {
      const lcLowlineId = lcRedirUrlIdPart.replace(/\~(?=\d+$)/, '_');
      mustBe.eeq(lcLowlineId, 'low-line redirect')(lcDoiAnnoVersId);
    }
    sortedLists.lineageIds.add(redirUrlIdPart.replace(/[~_]\d+$/, ''));
    sortedLists.redirTargetIdParts.add(redirUrlIdPart);
  });

  Object.entries(jsonReports).forEach(([dest, data]) => {
    let t = '\uFEFF{\n';
    Object.keys(data).sort().forEach((k) => {
      t += toJson(k) + ': ' + toJson(data[k]) + ',\n';
    });
    t += '"": null }\n';
    fs.writeFile('tmp.' + dest + '.json', t, 'UTF-8', Boolean);
  });

  Object.entries(sortedLists).forEach(([dest, list]) => {
    const t = Array.from(list.values()).sort().join('\n') + '\n';
    fs.writeFile('tmp.' + dest + '.txt', t, 'UTF-8', Boolean);
  });
}















runFromCLI();
