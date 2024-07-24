// -*- coding: utf-8, tab-width: 2 -*-

import fs from 'fs';

import arrayOfTruths from 'array-of-truths';
import getOwn from 'getown';
import isStr from 'is-string';
import mustBe from 'typechecks-pmb/must-be.js';
import objMapValues from 'lodash.mapvalues';
import sortedJson from 'safe-sortedjson';

import fixHtmlBody from './fixHtmlBody.mjs';


function uc1st(s) { return s.slice(0, 1).toUpperCase() + s.slice(1); }


function makeDumpStreamWriter(destFilename, init) {
  const stm = fs.createWriteStream(destFilename);
  function w(...a) { stm.write(...a); }
  if (init) { stm.write(init); }
  return w;
}

const dumpBodies = makeDumpStreamWriter('tmp.bodies.html',
  '<!DOCTYPE html><meta charset="UTF-8">\n');
const cpgTitleAnomaly = makeDumpStreamWriter('tmp.cpg-title-anomalies.tsv',
  'Author name\tTitle prefix\tAnno\n');
const cpgNoSource = makeDumpStreamWriter('tmp.cpg-no-source.tsv',
  'Author name\tTitle\tAnno\n');


function decideLabelValueConflict(body) {
  const v = body.value;
  const l = body.label;
  if (v === l) { return v; }
  const uv = uc1st(v);
  if (l === uv) { return l; }
  if (l.endsWith(', ' + uv)) { return l; }
  const ll = l.toLowerCase();
  const vv = v.toLowerCase();
  if ((vv === 'test') && /, /.test(l)) { return l; }
  if (vv.match(/^von [\w ]+, /) && (ll === vv.slice(4) + ' von')) { return l; }
  if (ll.includes('. ' + vv)) { return l; }
  if (ll.startsWith(vv + ', ')) { return l; }
  const badValues = [
    'Goebbels, Jose',
    'radolfzell unserer',
    'mariä himmelfahrt rad',
    'Central Collecting Point Wi',
    'reichenau-oberzell',
  ];
  if (badValues.includes(v)) { return l; }
  const vl = v + '|' + l;
  if (vl === 'Rahde, Mimi|Rahde, Mimi {tho') {
    if (body.source === 'http://d-nb.info/gnd/123226538') {
      return 'Rahde, Mimi tho'; // according to GND
    }
  }
  if (vl === 'Luttich, Mila|Luttich, Mila von') {
    if (body.source === 'http://d-nb.info/gnd/127921125') { return l; }
  }
  const vs = ({
    'Kunsthaus Ettle|Kunsthaus Wilhelm Ettle (Frankfurt, Main)': l,
    'reichenau münster|Reichenau / Münster': l,
    'Talipot|Talipot-Palme': l,
    'benvenuto da imola|Rambaldi, Benvenuto Da Imola': l,
    'benvenuto da Imo|Rambaldi, Benvenuto Da Imola': l,
  })[vl];
  if (vs) { return vs; }
}


function summarizeBodyKeys(body) {
  let bk = Object.keys(body).sort();
  bk = bk.filter(k => !((k === '@context') || (k === 'purpose')));
  return bk.join(',');
}


const rdfSchema = 'http://www.w3.org/2000/01/rdf-schema#';


const fallbackClassifyingSourcesByValue = {
  'Archäologie': 'http://d-nb.info/gnd/4002827-6',
  'Indien': 'http://d-nb.info/gnd/4026722-2',
  'Libellus Augustalis': 'https://d-nb.info/gnd/1193450470',
  'Nandi bull': 'DROP',
  'Parvati': 'http://d-nb.info/gnd/119158493',
  'Shiva': 'http://d-nb.info/gnd/118755218',
  'Sri Lanka': 'https://d-nb.info/gnd/4009696-8',
  'Wasserzeichen': 'http://d-nb.info/gnd/4064827-8',
};



function splitOmitFirst(text, expectedPartCount, mark) {
  const splat = text.split(mark);
  const nParts = splat.length;
  if (nParts === 1) { return false; }
  if (nParts !== expectedPartCount) {
    const e = ('splitOmitFirst: Expected ' + expectedPartCount
      + ' parts but got ' + nParts);
    throw new Error(e);
  }
  if (splat[0]) { return false; }
  return splat.slice(1);
}


function nextBodySameButWithValue(curBody, nextBody) {
  // e.g. RQhFU0y2SwiZwL8Uefwo_A~2#0 -> true
  if (!nextBody) { return; }
  if (!isStr(nextBody.value)) { return; }
  if (!nextBody.value.trim()) { return; }
  const curJson = sortedJson(curBody);
  const nextJson = sortedJson({ ...nextBody, value: undefined });
  return (curJson === nextJson);
}


function guessLinkingBodyValueFromSource(s, v) {
  if (s === 'https://oup.hypotheses.org/1871') {
    if (v === 'GOh_YpKfQ_CNbKPmiW1Dvw~1') {
      // from: GOh_YpKfQ_CNbKPmiW1Dvw~2
      return 'Transkription in dem Blog \u201eObjekt & Provenienz\u201c';
    }
  }
  if (s === 'https://oup.hypotheses.org/666') {
    if (v === 'RQhFU0y2SwiZwL8Uefwo_A~1') {
      // from: RQhFU0y2SwiZwL8Uefwo_A~2
      return 'Blog "Objekt & Provenienz"';
    }
  }
  let m = splitOmitFirst(s, 3, // e.g. SS1ju8OwTEqGuGAYubs2cQ~1#4
    /^https?:\/\/\w+\.wikipedia\.org\/wiki\/([\w%-\.]+)$/);
  if (m) { return decodeURIComponent(m[0].replace(/_/g, ' ')); }

  m = splitOmitFirst(s, 2, 'https://anthologiagraeca.org'
    + '/passages/urn:cts:greekLit:tlg7000.tlg001.ag:');
  if (/^\d+\.\d+\/$/.test(m[0])) {
    return 'Epigram ' + m[0].slice(0, -1) + ' @ Anthologia Graeca';
    // :TODO: verify: Q_UqrnkZSIC5LzY2yrUeOA~3
  }
}


function countHtmlTag(job, c, t, a, trace) {
  if (c && a) {
    console.error('countHtmlTag:', { c, t, a }, trace);
    throw new Error('A closing HTML tag must not have attributes!');
  }
  if (!a) {
    // selective whitelist
    if (t === 'Kopfbedeckung') { return; } // d-nb:gnd:4373143-0
    const d = t + ':' + (c || '¬');
    const ok = (countHtmlTag.ok.has(d)
      || (c && countHtmlTag.ok.has(t + ':¬')) /*
        ^-- when the attribute-less opening tag is allowed,
            then the closing tag must be allowed as well. */
      || fixHtmlBody.okEmptyBlockHtmlTags.includes(t)
      || fixHtmlBody.okEmptyInlineHtmlTags.includes(t));
    if (ok) {
      // job.counters.add('okEmptyBodyHtmlTag:' + t);
      return;
    }
    job.hintDictWithCounter('unexpectedBodyHtmlTag', d, trace);
    return;
  }
  const attrNames = [];
  a.replace(/\s((?:class|style)="[^"<>]*"|[\w:\-]+(?==))/g,
    (m, b) => attrNames.push(b));
  const d = t + ':' + (attrNames.sort().join(',') || ('¬' + a));
  if (countHtmlTag.ok.has(d)) {
    // job.counters.add('okBodyHtmlAttr:' + d);
    return;
  }
  job.counters.add('unexpectedBodyHtmlAttr:' + d);
}
countHtmlTag.ok = new Set([
  'a:/',
  'a:href',
  'a:id,name',
  'img:alt,src',
  'img:src',
  'p:¬',
  'p:class="ql-align-right"',
]);


const EX = function fixBodies(versId, annoData, job) {
  let bodies = annoData.body;
  function drop() { job.counters.add('uselessBodiesDiscarded'); }
  bodies = arrayOfTruths.ifAnyMap(bodies, function foundBody(origBody, idx) {
    const trace = versId + '#' + idx;
    const traceUrl = 'anno://' + versId + '#body[' + idx + ']';
    const body = { ...origBody };
    if (body.label) {
      const v = decideLabelValueConflict(body);
      if (v) {
        job.counters.add('bodyLabelsFixed');
        body.value = v;
        delete body.label;
      } else {
        job.hintDict('unmatchedValues', body.value + '|' + body.label, trace);
      }
    }

    if (body.predicate && body.source) {
      if (body.type === 'TextualBody') { delete body.type; }
    }

    Object.keys(body).forEach(function hotfix(k) {
      const v = body[k];
      if (v === '') { return delete body[k]; }
      if (k === '@context') {
        const j = JSON.stringify(v);
        if (j === '{"@language":"de"}') { return delete body[k]; }
      }
    });

    let bk = summarizeBodyKeys(body);
    if (!bk) { return drop(); }

    const bt = mustBe.tProp(traceUrl, body, [['oneOf', [
      undefined,
      'SpecificResource',
      'TextualBody',
    ]]], 'type');
    const p = mustBe.tProp(traceUrl, body, [['oneOf', [
      undefined,
      'classifying',
      'linking',
    ]]], 'purpose');

    if (trace === 'RzTWF4LUSkqDXFm_qL4dUQ~1#1') {
      body.source = body.value;
      body.value = 'Greek Anthology, Volume I, book 1, chapter 14';
    }
    if (body.value === 'libellus augustalis') {
      body.value = body.value.replace(/\w+/g, uc1st);
    }

    function fixedIt(goodBody) {
      job.counters.add('autofixedBodyType');
      // console.log('fixed:', trace, p, bk, goodBody);
      return goodBody;
    }

    if (bt === 'TextualBody') {
      if (bk === 'format,type') { return drop(); }
    }

    const annoTitle = annoData['dc:title'] || annoData.title || '';
    const authorName = annoData.creator.name || '??';
    let isCpg23;
    (function verifyOrFixCPGraec() {
      if (!annoTitle) { return; }
      const m = (/^(\w+|\S*pigram\w*) (\d+(?:\.\d+)+)$/.exec(annoTitle)
        || /^(Epigram|Scholion) (\d+)$/.exec(annoTitle));
      if (!m) { return; }
      if (m[1] === 'Foreword') { return; }
      const es = (((m[1] === 'Epigram') && 'e')
        || ((m[1] === 'Scholion') && 's'));
      if (!es) {
        job.counters.add('cpgTitleAnomaly:' + m[1]);
        cpgTitleAnomaly([authorName, m[1], trace].join('\t') + '\n');
        return;
      }
      // acceptMissingSourceBodies = 'cpg:' + es;
      let sc = annoData.target;
      sc = ((sc[0] || sc).scope || sc || '');
      const digi = 'https://digi.ub.uni-heidelberg.de/';
      const proj = (sc.startsWith(digi)
        && sc.slice(digi.length).replace(/\/\d+$/, ''));
      isCpg23 = ((proj === 'diglit_protected/cpgraec23_test')
        || (proj === 'diglit_protected/cpgraec23')
        || (proj === 'diglit/cpgraec23_test')
        || (proj === 'diglit/cpgraec23')) && sc;
      if (!isCpg23) { throw new Error('Expected cpg23: ' + sc); }
    }());


    function sourceMissing() {
      let k = body.value;
      k = getOwn(sourceMissing.aliases, k, k);
      const d = job.hintDict(p + 'BodyValueWithoutSource');
      d[k] = (d[k] || []).concat(traceUrl);
    }
    sourceMissing.aliases = {
      'Anthologia Graeca Project': 'Anthologia Graeca',
      'Greek Anthology Project': 'Anthologia Graeca',
    };

    if (p === 'linking') {
      if (bk === 'predicate') { return drop(); } // useless w/o source
      if (bk === 'predicate,source') {
        const nextBody = bodies[idx + 1];
        if (nextBodySameButWithValue(body, nextBody)) { return drop(); }
        const v = guessLinkingBodyValueFromSource(body.source, versId);
        if (v) {
          body.value = v;
        } else {
          job.hintDict(p + 'BodySourceWithoutValue', body.source, trace);
        }
      }
      if (bk === 'source,value') { body.predicate = rdfSchema + 'seeAlso'; }

      bk = summarizeBodyKeys(body);

      if (bk === 'predicate,value') {
        mustBe.nest(trace + ' sourceMissing value', body.value);
        const b = {
          type: 'TextualBody',
          purpose: p,
          'rdf:predicate': body.predicate,
          value: body.value,
        };
        if (isCpg23) {
          cpgNoSource([authorName, annoTitle, trace].join('\t') + '\n');
          b.source = { isCpg23 };
        }
        return fixedIt(b);
      }
      if ((bk === 'predicate,source,value') || (bk === 'predicate,source')) {
        return fixedIt({
          type: 'SpecificResource',
          purpose: p,
          'rdf:predicate': body.predicate,
          ...(body.value && { 'dc:title': body.value }),
          source: body.source,
        });
      }
      const u = 'Unexpected linking body: ' + bk + ' @ ' + traceUrl;
      console.error(u, body);
      throw new Error(u);
    }

    if (p === 'classifying') {
      if (bk === 'value') {
        let s = getOwn(fallbackClassifyingSourcesByValue, body.value);
        if (!s) {
          const u = uc1st(body.value);
          s = getOwn(fallbackClassifyingSourcesByValue, u);
          if (s) { body.value = u; }
        }
        if (s) {
          if (s === 'DROP') { return drop(); }
          body.source = s;
          bk = summarizeBodyKeys(body);
        }
      }
      if (bk === 'source,value') {
        return fixedIt({
          type: 'SpecificResource',
          purpose: p,
          'dc:title': body.value,
          source: body.source,
        });
      }
      if (bk === 'value') { sourceMissing(); }
    }

    if (bt) {
      job.counters.add('validBodyType');
      // console.debug('valid:', body);
      return body;
    }

    // job.assume('validBodyType:' + versId, { k: bk, purpose: p });
    const i = 'invalidBodyType';
    const t = p + '{' + bk + '}';
    job.hintDictWithCounter(i, t, trace);
    job.counters.add(i + ':' + t);
    return body;
  }) || [];

  const textualBodies = [];
  bodies = bodies.map(function checkUncommonTextualBodies(body, idx) {
    if (body.type !== 'TextualBody') { return body; }
    const u = 'uncommonTextualBody';
    const w = { ...body };
    delete w.format;
    delete w.type;
    if (w.value) { delete w.value; } else { w.value = '¬'; }
    if (w['rdf:predicate']) {
      w['rdf:predicate'] = '…';
    }
    if ((w.source || false).isCpg23) {
      const b = { ...body };
      delete b.source;
      return b;
    }
    if (w.source) { w.source = '…'; }
    if (idx !== 0) { w.index = idx; }
    if (Object.keys(w).length) {
      // console.error('W:', u, traceUrl, w);
      job.counters.add(u + ':*');
      job.hintDictWithCounter(u, JSON.stringify(w).replace(/"/g, ''),
        versId + '#body[' + idx + ']');
    }
    if (!(body.value || body.purpose)) { return false; }
    textualBodies.push(body);
    return false;
  });
  bodies = arrayOfTruths(textualBodies.concat(bodies));
  if (!bodies.length) {
    // job.assume('hasActualBody:' + versId);
    job.counters.add('noActualBody');
  }
  if (textualBodies.length > 1) {
    job.counters.add('multipleTextualBodies:' + textualBodies.length);
  }

  bodies.forEach(function dumpBody(body, idx) {
    const trace = versId + '#body[' + idx + ']';
    dumpBodies('<dl data-url="' + trace + '">\n');
    if (body.type === 'TextualBody') {
      if (body.format === 'text/html') {
        // eslint-disable-next-line no-param-reassign
        body.value = fixHtmlBody(trace, body.value, job);
      }
    }
    objMapValues(body, function bodyPart(v, k) {
      let bpt = String(v && typeof v);
      if (bpt === 'object') { bpt = k + '={' + Object.keys(v).sort() + '}'; }
      job.counters.add('bodyPartType:' + bpt);
      dumpBodies('  <dt>' + k + '</dt><dd>' + v + '</dd>\n');
      String(v || '').replace(/<(\/?)([\w:\-]+)([^<>]*)/g,
        (m, c, t, a, i, orig) => countHtmlTag(job, c, t, a,
          [trace, orig.slice(0, i), orig.slice(i)]));
    });
    dumpBodies('</dl><!-- ' + trace + ' -->\n');
  });

  if (bodies.length === 1) { return bodies[0]; }
  return bodies;
};


export default EX;
