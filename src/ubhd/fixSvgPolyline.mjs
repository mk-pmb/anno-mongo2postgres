// -*- coding: utf-8, tab-width: 2 -*-

import arrayOfTruths from 'array-of-truths';


const EX = function fixSvgPolyline(anno, job) {
  const { recId } = anno;
  const versId = recId.replace(/>dp-v-(\d+)$/, (m, i) => '~' + (+i + 1));
  arrayOfTruths(anno.data.target).forEach(function eachTarget(tgt, tgtIdx) {
    const sel = (tgt.selector || false);
    if (sel.type !== 'SvgSelector') { return; }
    let plIdx = 0;
    sel.value = sel.value.replace(EX.rgx, function fix(m, pointsStr) {
      const trace = versId + '#target[' + tgtIdx + '].polyline[' + plIdx + ']';
      plIdx += 1;
      const pointCoords = pointsStr.split(/\s+/).filter(Boolean);
      const [firstCoord] = pointCoords;
      const [lastCoord] = pointCoords.slice(-1);
      if (lastCoord === firstCoord) {
        pointCoords.pop();
        // const h = job.hint('polyline:closed', undefined, {});
        // h[trace] = m;
        // } else {
        //   job.hint('polyline:open', undefined, []).push(trace);
      }
      const nCoord = pointCoords.length;
      if (nCoord === 2) {
        const l = EX.coordsToLine(pointCoords);
        // console.error('Fix SVG:', trace);
        // console.error('  old:', m);
        // console.error('  new:', l);
        return l;
      }
      if (nCoord < 3) {
        const h = job.hint('polyline:tooFewPoints', undefined, {});
        h[trace] = pointsStr;
      }
      return '<polygon points="' + pointCoords.join(' ') + '" />';
    });
  });
};


Object.assign(EX, {

  rgx: /<polyline points="([\d\.,\s]+)"\s*\/>/g,

  coordsToLine(c) {
    return ['<line', ...c.map((s, i) => ('x#="' + s.replace(/,/, '" y#="')
      + '"').replace(/#/g, i + 1)), '/>'].join(' ');
  },

});



export default EX;
