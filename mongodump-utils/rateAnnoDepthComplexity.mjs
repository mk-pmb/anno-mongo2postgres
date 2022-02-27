// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';


function len(x) { return (+(x || false).length || 0); }
function listLenSymb(o, k, s) { return getOwn(s, len(o[k]), s.slice(-1)[0]); }


const rate = function rateAnnoDepthComplexity(anno) {

  const hasVersions = listLenSymb(anno, '_revisions', [
    'nv', // no versions
    '',   // exactly one version
    'v',  // multiple versions
  ]);

  let hasComments = listLenSymb(anno, '_replies', [
    '',   // no comments
    'c',  // has comments
  ]);
  if (hasComments && (anno.creator === 'wgd@DWork')) {
    // WGD = Projekt ›Welscher Gast digital‹: The comment hierarchy
    // was abused to express subjectTarget hierarchy.
    // Clarify the comment rating:
    hasComments = 'h'; // meant to express 'h'ierarchy
  }

  const hasDeepData = hasVersions + hasComments;
  return (hasDeepData || 's'); // s = simple: no nested data
};


export default rate;
