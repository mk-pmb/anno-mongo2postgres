// -*- coding: utf-8, tab-width: 2 -*-

import fixHtmlBody from './fixHtmlBody.mjs';

/*
const famiBlue = '<em blue><u>familysearch.org/ark:/61903/1:1:.</u></em></p>';
console.debug(fixHtmlBody.blueUnderlinedUrls(famiBlue));
*/

const trace = 'scratchpad';

const h = fixHtmlBody.core(trace, '<p>'
  + '<a href="http://heidicon.ub.uni-heidelberg.de/id/517442">'
  + '<img src="http://heidicon.ub.uni-heidelberg.de/emsfile/asset'
  + '?t=1&i=unib-heidelberg&c=1036&o=517442&v=160"/></a><br>"hi"</p>');
console.debug(h);
console.debug(fixHtmlBody.saniFunc(h));
