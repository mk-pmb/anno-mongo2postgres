// -*- coding: utf-8, tab-width: 2 -*-

function fail(e) { throw new Error(e); }

// const fail1s = e => s => fail(e + ': ' + s);
// const imm = f => (...a) => setImmediate(f, ...a);


const EX = function fixHtmlBody(trace, origHtml) {
  if (!origHtml) { return origHtml; }
  return EX.loop('Main loop', origHtml, EX.mainLoop,
    'fixHtmlBody: ' + trace + ': ');
};


EX.loop = function loopUntilNothingChanged(loopName, input, func, ...args) {
  let s = input;
  let looped = 0;
  let prev;
  while (looped < 100) {
    looped += 1;
    prev = s;
    s = func(s, ...args);
    if (looped > 20) { console.error('W:', loopName, '×', looped); }
    if (!s) { fail(loopName + ' lost all text'); }
    if (s === prev) { return s; }
  }
  fail(loopName + ' got stuck!');
};


EX.mainLoop = function mainLoop(input, trace) {
  let h = input;

  h = h.replace(/<img class="citavipicker"[^<>]*>/g, '');
  h = h.replace(/<a href="javascript:">(?:<\/a>)+/g, '');
  h = h.replace(/(<a) href="about:blank"/g, '$1');
  h = h.replace(/<(\w+) [^<>]*>/g, EX.fixHtmlTagAttrs);
  h = h.replace(/(<\/p>)(<p>)/g, '$1\n$2');
  h = h.replace(/(Vgl\. )&nbsp;(?=<a )/g, '$1');
  h = h.replace(/(<a(?= )[^<>]*) target="[^"<>]*"/g, '$1');
  h = h.replace(/(<a(?= )[^<>]*) rel="noopener noreferrer"/g, '$1');
  h = h.replace(/(<strong) style="color: red;"(>\[link)(?=\]<\/strong>)/g,
    '$1$2 missing'); // z.B. VsbZXisoRh6Tj3GjlitUVQ
  h = EX.blueUnderlinedUrls(h);

  h = h.replace(
    /<a( href="#\w+"|)(?: class="ql-size-small"|)>(\[\d+\]<\/a>)(?!<\/sup)/g,
    '<sup><a$1>$2</sup>',
  );
  h = h.replace(/(<a href="#_ftn\d+") [^<>]*>(\[\d+\])(<\/a>)(?!<\/sup)/g,
    '<sup>$1>$2$3</sup>');
  h = h.replace(/(<a)(>\[(\d+)\]<\/a>)/g, '$1 href="#_ftn$3"$2');
  h = h.replace(/(<a\b[^<>]*>)(<sup>)/g, '$2$1');
  h = h.replace(/(<\/sup>)(<\/a>)/g, '$2$1');
  h = h.replace(/<a>(<em>\[\d+\])<\/em><\/a><em>\s*/g, '$1 ');
  h = h.replace(/(<p class=")ql-align(-\w+">)/g, '$1text$2'); /*
    Convert quill-specific alignment classes to Bootstrap:
    A more neutral approach, that would also be easier to implement securely,
    would be to use the align="…" attribute, but that has become deprecated in
    HTML5. A direct style="…" attribute would require more effort in sanitizing
    and would also waste more bytes.
    Overall, using the Bootstrap classes seems to be a good compromise even for
    clients that don't specifically understand Bootstrap, because a CSS shim
    for the few alignment classes is simple and tiny. */
  h = h.replace(/<br[\/\s]+>/g, '<br>');
  h = h.replace(/<p>((?:<br>)*)<\/p>/g, '');
  h = h.replace(/(\s+)((?:<\/\w+>)+)/g, '$2$1');
  h = h.replace(/<span class="ql-size-small">([^<>]*)<\/span>/g,
    '<small>$1</small>');
  h = EX.loop('Unpack useless tags loop', h, EX.unpackUselessTags);
  h = h.replace(/(<p>(?:<em>|))\[(\d+)\] ?/g,
    '$1<a id="_ftn$2" name="_ftn$2">[$2]</a> ');
  if (h.includes('</em>')) { h = EX.advancedEmFixes(trace, h); }
  h = EX.mergeHomonymousTags(h);
  h = h.trim().replace(/\s+\n/g, '\n');

  return h;
};


EX.okEmptyBlockHtmlTags = [
  'h2',
  'li',
  'ol',
  'ul',
];


EX.okEmptyInlineHtmlTags = [
  'br',
  'em',
  'i',
  's',
  'strong',
  'sub',
  'sup',
  'u',
];


EX.unpackUselessTags = (function compile() {
  const inlineTags = EX.okEmptyInlineHtmlTags.join('|');
  const rxMergeSpace = new RegExp('<(' + inlineTags + ')( [^<>]*|)>'
    + '(\\s*)</(' + inlineTags + ')>', 'g');

  const rxUnpackUselessTag = new RegExp('<span>'
    + '([^<>]*<(\\w+)(?: [^<>]+|)>[^<>]*</(\\w+)>[^<>]*)'
    + '</span>', 'g');
  rxUnpackUselessTag.r = (m, i, o, c) => (o === c ? i : m);

  return function unpackUselessTags(input) {
    let h = input;
    h = h.replace(rxUnpackUselessTag, rxUnpackUselessTag.r);
    h = h.replace(/<span>((?:[^<>]|<br>)*)<\/span>/g, '$1');
    h = h.replace(rxMergeSpace, (orig, open, attr, space, close) => {
      if (open !== close) { return orig; }
      let a = attr;
      a = a.replace(/( style=") *color: [^;]+(;|(?="))/, '$1');
      a = a.replace(/ style=" *"/, '').trim();
      if (!a) { return space; }
    });
    return h;
  };
}());


EX.warnMatch = function warnMatch(tx, w, rx) {
  const m = rx.exec(tx);
  if (m) { console.error('W:', w, m.slice()); }
};


EX.blueUnderlinedUrls = function blueUnderlinedUrls(orig) {
  let h = orig;
  h = h.replace(/(<\w+) style="color: blue;">/g, '$1 blue>');
  h = h.replace(/(<\w+) style="color: rgb\(\d{1,2}, \d{1,2}, 2\d{2}\);">/g,
    '$1 blue>');
  h = h.replace(/<u (\w+)>([^<>]*)<\/u>/g, '<DUMMY $1><u>$2</u></DUMMY>');
  h = h.replace(/<(\w+) blue><u>(\w+\.\w+\/[^<> "]*)<\/u><\/(\w+)>/g,
    //           $1 = <o>pen    $2 = <u>rl                  $3 = <c>lose
    (m, o, u, c) => (o === c ? ('<' + o + '><a href="https://www.'
      + u + '">' + u + '</a></' + c + '>') : m));

  h = h.replace(/<\/?DUMMY>/g, '');
  return h;
};


EX.mergeHomonymousTags = (function compile() {
  const inlineTags = EX.okEmptyInlineHtmlTags.join('|');
  const rxAttr = new RegExp('<(?:' + inlineTags + ')\\s[^<>]*>', 'g');
  const rxMergeSpace = new RegExp('</(' + inlineTags
    + ')>(\\s*)<(' + inlineTags + ')>', 'g');
  return function mergeHomonymousTags(orig) {
    let h = orig;
    const attr = rxAttr.exec(orig);
    if ((attr || false).length) {
      const e = 'mergeHomonymousTags: flinch: Found tag with attributes';
      console.error(e, Array.from(attr));
      console.error('    @-->', attr.input);
      fail(e);
    }
    h = h.replace(rxMergeSpace, EX.unpackIfSameTag);
    return h;
  };
}());


EX.unpackIfSameTag = function unpackIfSameTag(origMatch, open, text, close) {
  return (open === close ? text : origMatch);
};


EX.advancedEmFixes = function advancedEmFixes(trace, orig) {
  /* Seltsame <em> Verschachtelungen u.a. in GhAU4GUnSQiGu_FX_-wnIg nahe
    "Boerner Düsseldorf, nach freundlicher Auskunft." */

  let h = orig.replace(/<em\b/g, '<¤').replace(/<\/em>/g, '<¬>'); /*
    ^-- Replace em tags with non-alphanumeric mark to distinguish them from
        all other tags that we may want to re-arrange around the <em>s. */
  if (orig.includes('¤')) { fail(trace + 'Found marker symbol!'); }
  if (orig.includes('¬')) { fail(trace + 'Found end marker symbol!'); }

  h = h.replace(/(<¤>[^<>]*)<¬><¤>/g, '$1');
  h = h.replace(
    /<¬>(\s*<[au] [^<>]*>\s*)<¤>([^<>]*)<¬>(\s*<\/[au]>\s*)<¤>/g,
    '$1$2$3',
  );
  h = h.replace(/(<\w+>)(<[au] [^<>]*>)<¤>([^<>]*)<¬>(<\/[au]>)<¤>/g,
    '$1<¤>$2$3$4'); //   $2                $3         $4

  h = h.replace(/(<¤>(?:<\/?\w+\b[^<>]*>|[^<>])+)<¬> <¤>/g, '$1');
  h = h.replace(/(<p><sup><a[^<>]*>\[\d+\]<\/a><\/sup> )<¤>([^<>]*)<¬><\/p>/g,
    '$1$2</p>');

  h = h.replace(/<¤/g, '<em').replace(/<¬>/g, '</em>');
  return h;
};


EX.fixHtmlTagInlineCss = function fixHtmlTagInlineCss(orig, tagName) {
  let b = orig.replace(/^ style="/, ' ');
  b = b.replace(/ color: (black|windowtext);/, ' ');

  // "Almost black" colors; if this list grows, consider using actual
  // HSL conversion to check.
  b = b.replace(/ color: rgb\(51, 51, 51\);/, ' ');
  b = b.replace(/ color: rgb\(33, 37, 41\);/, ' ');
  b = b.replace(/ color: rgb\(6, 35, 51\);/, ' ');
  b = b.replace(/ color: rgb\(0, 0, 0\);/, ' ');

  // Users' custom highlight colors
  if (tagName === 'strong') {
    b = b.replace(/ color: rgb\(0, 176, 240\);/, ' ');
    // ^-- z.B. M8awNnXoQEqX3pOnbCoZaA~1
  }

  // Users' custom link colors
  if (tagName === 'a') {
    b = b.replace(/ color: rgb\(\d{2,3}, 0, 0\);/, ' ');
    // ^-- z.B. DL9uLuqDSl-TNF7ZmYoJCQ~1
    b = b.replace(/ color: (blue);/, ' ');
    // ^-- z.B. Elcow9nWSxSIbSNO5vmFcA~1
  }

  // Effectively-white or almost-white background:
  b = b.replace(/ background-color: (white|transparent);/, ' ');
  b = b.replace(/ background-color: rgb\((?:2[45]\d,? ?){3}\);/, ' ');

  if (tagName === 'img') {
    b = b.replace(/ width: \d+%;/, ' ');
  }


  b = b.trim();
  if (b === '"') { return ''; }
  b = ' style="' + b;
  return b;
};


EX.fixHtmlTagAttrs = function fixHtmlTagAttrs(orig, tagName) {
  let b = orig;
  b = b.replace(/ class="ql-cursor"/g, '');
  b = b.replace(/ style="[^"<>]*"/g, m => EX.fixHtmlTagInlineCss(m, tagName));
  return b;
};


export default EX;
