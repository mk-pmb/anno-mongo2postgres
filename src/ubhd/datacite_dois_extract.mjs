// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import mustBe from 'typechecks-pmb/must-be.js';
import pProps from 'p-props';
import promisingFs from 'fs/promises';

import ubFacts from './facts.mjs';


const oldBaseUrl = 'https://anno.ub.uni-heidelberg.de/anno/anno/';

function toJson(x) { return JSON.stringify(x, null, 1).replace(/\n */g, ' '); }


function splitDoiVerSep(doiVersIdPart) {
  return doiVersIdPart.split(/([_~])(?=\d+$)/).concat('', '').slice(0, 3);
}


async function writeShallowSortedJsonObj(dest, data) {
  let t = '\uFEFF{\n';
  Object.keys(data).sort().forEach((k) => {
    t += toJson(k) + ': ' + toJson(data[k]) + ',\n';
  });
  t += '"": null }\n';
  await promisingFs.writeFile(dest, t, 'UTF-8');
}


async function runFromCLI() {
  const srcJson = './tmp.datacite_dois_all.json';
  const allDoisData = (await import(srcJson)).default.data;
  const sortedLists = {
    doibotVersepExceptions: new Set(),
    lineageIds: new Set(),
    redirTargetIdParts: new Set(),
    doiVerSepUsage: new Set(),
  };
  const jsonReports = {
    versIdToDoiPart: {},
    doiPartToVersId: {},
  };
  const doiVerSepCounters = { '': 0, '_': 0, '~': 0 };
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

    const [lcBaseId, doiVerSep, verNum] = splitDoiVerSep(lcDoiAnnoVersId);
    doiVerSepCounters[doiVerSep] += 1;

    if (doiVerSep) {
      sortedLists.doiVerSepUsage.add([
        attr.created,
        doiVerSep,
        verNum,
        lcDoiAnnoVersId,
      ].join('\t'));
    }
    if (doiVerSep === '~') {
      sortedLists.doibotVersepExceptions.add('  /' + lcBaseId + '/~');
      // writeShallowSortedJsonObj('attr.' + lcDoiAnnoVersId + '.json', attr);
    }

    const lcRedirUrlIdPart = redirUrlIdPart.toLowerCase();
    if (lcRedirUrlIdPart !== lcDoiAnnoVersId) {
      const lcLowlineId = lcRedirUrlIdPart.replace(/\~(?=\d+$)/, '_');
      mustBe.eeq(lcLowlineId, 'low-line redirect')(lcDoiAnnoVersId);
    }
    const lineageId = redirUrlIdPart.replace(/[~_]\d+$/, '');
    sortedLists.lineageIds.add(lineageId);
    sortedLists.redirTargetIdParts.add(redirUrlIdPart);
  });

  Object.assign(sortedLists.doibotVersepExceptions, {
    saveFn: 'tmp.versep_exceptions.rc',
    decorate(v) {
      const k = 'anno_url_versep_exceptions';
      if (!v.length) { throw new Error('Empty list for ' + k); }
      return ['CFG[' + k + "]='", ...v, "  '"];
    },
  });

  await pProps(jsonReports,
    (data, dest) => writeShallowSortedJsonObj('tmp.' + dest + '.json', data));

  await pProps(sortedLists, async (list, dest) => {
    let v = Array.from(list.values()).sort();
    if (list.decorate) { v = list.decorate(v); }
    const t = v.join('\n') + '\n';
    const s = (list.saveFn || ('tmp.' + dest + '.txt'));
    await promisingFs.writeFile(s, t, 'UTF-8');
  });

  console.debug('D: doiVerSepCounters:', doiVerSepCounters);
  console.info('+OK Success.');
}















runFromCLI();
