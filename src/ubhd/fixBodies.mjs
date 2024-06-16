// -*- coding: utf-8, tab-width: 2 -*-

import arrayOfTruths from 'array-of-truths';
import getOwn from 'getown';
import isStr from 'is-string';
import mustBe from 'typechecks-pmb/must-be.js';
import objMapValues from 'lodash.mapvalues';
import sortedJson from 'safe-sortedjson';


function uc1st(s) { return s.slice(0, 1).toUpperCase() + s.slice(1); }


function fixStr(s) {
  if (!isStr(s)) { return s; }
  let b = s.trim();
  // Fix U+0308 combining diaeresis (̈)
  b = b.replace('a\u0308', 'ä');
  b = b.replace('A\u0308', 'Ä');
  b = b.replace('o\u0308', 'ö');
  b = b.replace('O\u0308', 'Ö');
  b = b.replace('u\u0308', 'ü');
  b = b.replace('U\u0308', 'Ü');
  return b;
}


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


const EX = function fixBodies(versId, origBodies, job) {
  let bodies = arrayOfTruths(origBodies);
  bodies.map(function foundBody(origBody, idx) {
    const trace = versId + '#' + idx;
    const traceUrl = 'anno://' + versId + '#body[' + idx + ']';
    const body = objMapValues(origBody, fixStr);
    if (body.label) {
      const v = decideLabelValueConflict(body);
      if (v) {
        job.counters.add('bodyLabelsFixed');
        body.value = v;
        delete body.label;
      } else {
        const d = job.hint('unmatchedValues', undefined, {});
        d[body.value + '|' + body.label] = trace;
      }
    }
    Object.keys(body).forEach(function hotfix(k) {
      const v = body[k];
      if (v === '') { delete body[k]; }
    });

    function drop() { job.counters.add('uselessBodiesDiscarded'); }

    let bk = summarizeBodyKeys(body);
    if (!bk) { return drop(); }

    const bt = mustBe.tProp('body#' + idx, body, [['oneOf', [
      undefined,
      'TextualBody',
    ]]], 'type');
    const p = mustBe.tProp('body#' + idx, body, [['oneOf', [
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

    function sourceMissing() {
      const d = job.hint(p + 'BodyValueWithoutSource', undefined, {});
      let k = body.value;
      k = getOwn(sourceMissing.aliases, k, k);
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
          const d = job.hint(p + 'BodySourceWithoutValue', undefined, {});
          d[body.source] = trace;
        }
      }
      if (bk === 'source,value') { body.predicate = rdfSchema + 'seeAlso'; }

      bk = summarizeBodyKeys(body);

      if (bk === 'predicate,value') {
        // sourceMissing();
        job.counters.add('autofixedBodyType');
        mustBe.nest(trace + ' sourceMissing value', body.value);
        return {
          type: 'TextualBody',
          purpose: p,
          'rdf:predicate': body.predicate,
          value: body.value,
        };
      }
      if ((bk === 'predicate,source,value') || (bk === 'predicate,source')) {
        job.counters.add('autofixedBodyType');
        return {
          type: 'SpecificResource',
          purpose: p,
          'rdf:predicate': body.predicate,
          ...(body.value && { 'dc:title': body.value }),
          source: body.source,
        };
      }
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
        job.counters.add('autofixedBodyType');
        return {
          type: 'SpecificResource',
          purpose: p,
          'dc:title': body.value,
          source: body.source,
        };
      }
      if (bk === 'value') { sourceMissing(); }
    }

    if (bt) {
      job.counters.add('validBodyType');
      return body;
    }

    // job.assume('validBodyType:' + versId, { k: bk, purpose: p });
    const i = 'invalidBodyType';
    const t = p + '{' + bk + '}';
    job.counters.add(i);
    job.counters.add(i + ':' + t);
    const d = job.hint(i + 'Examples', undefined, {});
    d[t] = trace;
    return body;
  });
  bodies = arrayOfTruths(bodies);
  if (!bodies.length) {
    // job.assume('hasActualBody:' + versId);
    job.counters.add('noActualBody');
  }
  return bodies;
};


export default EX;
