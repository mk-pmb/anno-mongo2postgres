// -*- coding: utf-8, tab-width: 2 -*-

import fixHtmlBody from './fixHtmlBody.mjs';

const famiBlue = '<em blue><u>familysearch.org/ark:/61903/1:1:.</u></em></p>';
console.debug(fixHtmlBody.blueUnderlinedUrls(famiBlue));
