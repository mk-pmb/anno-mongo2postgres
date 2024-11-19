// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import mustBe from 'typechecks-pmb/must-be.js';
import objPop from 'objpop';
import promisingFs from 'fs/promises';
import readDataFile from 'read-data-file';
import uuidv5 from 'uuidv5';


import translateLegacyRoles from './legacyRoles.json';
import ubFacts from './facts.mjs';

const { annoBaseUrl, serverBaseUrl } = ubFacts;
const authorIdNamespace = '/authors/uuidbase/';
const uuidBaseUrl = serverBaseUrl + authorIdNamespace;
const buggyUuidAgentBaseUrl = annoBaseUrl + authorIdNamespace.slice(1);

const customUserURLs = {
  'wgd@DWork':
    'https://digi.ub.uni-heidelberg.de/wgd/index/welscher_gast.html',

  'anonymous@example.org':
    'https://www.ub.uni-heidelberg.de/',
};
const byLegacyName = {};
const byUUID = {};
let fixBuggyUuidAgentId = '';
const namelessUsers = [];
let as22currentUser;
const as22usersYaml = {};
const jsonTrailingNoComma = 'JSON git fix: No comma after this';

function orf(x) { return x || false; }
function mustPop(x) { return objPop(x, { mustBe }).mustBe; }


function flatMapObj(x, f) { return Object.entries(x).map(v => f(...v)); }


function expectSingleNestProp(dictDescr, dictObj, key) {
  const j = Object.keys(dictObj).join(', ');
  mustBe('eeq:"' + key + '"', 'Keys in ' + dictDescr)(j);
  return mustBe.nest('Property ' + key + ' in ' + dictDescr, dictObj[key]);
}


const EX = {

  async main() {
    const userCfg = await readDataFile('../../dumps/latest.users.yaml');
    delete (orf(userCfg['anonymous@example.org']).public || {}).icon;
    flatMapObj(userCfg, EX.learnUser);

    byLegacyName[''] = jsonTrailingNoComma;
    byUUID[''] = jsonTrailingNoComma;
    const output = JSON.stringify({
      byLegacyName,
      byUUID,
    }, null, 2) + '\n';
    await promisingFs.writeFile('tmp.author_identities.json', output, 'UTF-8');

    await promisingFs.writeFile('tmp.fixBuggyUuidAgentId.sed',
      fixBuggyUuidAgentId, 'UTF-8');

    await promisingFs.writeFile('tmp.as22users.yaml', [
      '%YAML 1.2',
      '# -*- coding: UTF-8, tab-width: 4 -*-',
      '---',
      '',
      ...flatMapObj(as22usersYaml, (u, l) => (JSON.stringify(u)
        + ':\n' + l.join('\n') + '\n\n').replace(/\n( |\w)/g, '\n    $1')),
      '...',
      '',
    ].join('\n'), 'UTF-8');

    if (namelessUsers.length) {
      console.warn('W:', namelessUsers.length, 'users had no name:',
        namelessUsers.join(', '));
    }
  },


  learnUser(legacyUserName, userSpec) {
    const lunEnc = encodeURI(legacyUserName);
    if (lunEnc !== legacyUserName) {
      throw new Error('Legacy username needs encoding: ' + lunEnc);
    }
    if (!userSpec) { return; }
    const customUserURL = getOwn(customUserURLs, legacyUserName);
    const profileUrl = (customUserURL || (uuidBaseUrl + lunEnc));
    const uuid = uuidv5('url', profileUrl);
    const agent = { id: 'urn:uuid:' + uuid };

    const pop = mustPop(userSpec);

    const userPub = pop('obj | undef', 'public');
    if (userPub) {
      agent.name = expectSingleNestProp('field "public"',
        userPub, 'displayName');
    }
    const auids = pop('obj | undef', 'author_identities');
    if (auids) {
      if (userPub) { throw new Error('Mixed format versions'); }
      const [firstAuId, ...tooMany] = Object.values(auids);
      if (tooMany.length) { throw new Error('Too many AuIDs'); }
      Object.assign(agent, firstAuId);
    }

    byUUID[uuid] = agent;
    byLegacyName[legacyUserName] = uuid;

    const logLineParts = [uuid, agent.type, agent.name];
    if (!agent.name) {
      agent.name = '???_NO_LEGACY_NAME_???';
      namelessUsers.push(legacyUserName);
      logLineParts.push(legacyUserName);
    }
    if (agent.name === 'NN') { delete agent.name; }
    if (!agent.type) { agent.type = EX.guessAgentType(agent); }
    // console.debug(logLineParts.join('\t'));

    /* Versions before 2024-11-12 had a bug that wrote a raw UUID as the
      author ID key, causing the server to UUIDv5-hash it again.
      Additionally, it used the annoBaseUrl instead of serverBaseUrl,
      thus inserting an errornous "anno/" part into the profileUrl.
      */
    const buggyAgentUuid = uuidv5('url', buggyUuidAgentBaseUrl + lunEnc);
    const buggyDoubleHashedUuid = uuidv5('url', uuidBaseUrl + buggyAgentUuid);
    byLegacyName[buggyAgentUuid] = uuid;
    byLegacyName['urn:uuid:' + buggyAgentUuid] = uuid;
    byLegacyName[buggyDoubleHashedUuid] = uuid;
    byLegacyName['urn:uuid:' + buggyDoubleHashedUuid] = uuid;

    as22currentUser = [
      'author_identities:',
      `    '${agent.id}':`,
      `        # ^-- UUIDv5 of URL <${profileUrl}>`,
      `        # Old wrong UUIDs: ${buggyAgentUuid}, ${buggyDoubleHashedUuid}`,
      `        name: ${JSON.stringify(agent.name)}`,
      `        type: ${agent.type}`,
    ];
    as22usersYaml[legacyUserName] = as22currentUser;

    /* We use sed on an SQL dump and then do text replacement of the buggy
       UUIDs because Postgres's JSON update functions would potentially
       re-order the anno keys and may also alter the whitespace, both effects
       causing needless diff noise when comparing backups. */
    fixBuggyUuidAgentId += ('s~"urn:uuid:(' + buggyAgentUuid + '|'
     + buggyDoubleHashedUuid + ')"~"' + agent.id + '"~g # ' + lunEnc + '\n');

    const aliases = [].concat(pop('undef | ary', 'alias'),
      pop('undef | ary', 'upstream_userid_aliases')).filter(Boolean);
    if (aliases.length) {
      as22currentUser.push('', 'upstream_userid_aliases:');
      aliases.forEach(function addAlias(al) {
        if (al.id) {
          return addAlias(expectSingleNestProp('alias', al, 'id'));
        }
        mustBe.nest('upstream user ID alias', al);
        byLegacyName[al] = uuid;
        as22currentUser.push('    - id: ' + JSON.stringify(al));
      });
    }

    pop('undef | eeq:"admin"', 'role');
    const rules = orf(pop('undef | ary', 'rules'));
    const aclGrp = orf(pop('undef | ary', 'acl_user_groups'));
    if (rules.length || aclGrp.length) {
      as22currentUser.push('', 'acl_user_groups:');
      (rules || []).forEach(EX.learnOneAclEntry);
      (aclGrp || []).forEach(g => as22currentUser.push('    - '
        + JSON.stringify(g)));
    }

    pop.expectEmpty();
  },


  guessAgentType(agent) {
    const { name } = agent;
    const org = (/^Proje[ck]t /.test(name)
      || /^Abt\. /.test(name)
      || /^SFB /.test(name)
      || /^Universität/.test(name)
      || /^Römische Inschriften\b/.test(name)
    );
    if (org) { return 'Organization'; }
    return 'Person';
  },


  orSplitRgx: /"([\w\.]+)":\{"\$or":(\[[ -z]*\])\}/,


  learnOneAclEntry([conditions, ruleEffects]) {
    const { role, ...otherEffects } = ruleEffects;
    mustBe.empty('unsupported rule effects', otherEffects);

    const trace = ('    # ' + JSON.stringify(conditions, null,
      1).replace(/\s*\n\s*/g, ' ') + ' => ' + role);
    as22currentUser.push(trace);
    // console.debug(trace);

    const orSplat = JSON.stringify(conditions).split(EX.orSplitRgx);
    if (orSplat.length === 1) { return EX.addOneAclGroup(conditions, role); }
    if (orSplat.length !== 4) { throw new Error('Cannot multi-$or'); }
    const k = orSplat[1];
    const list = JSON.parse(orSplat[2]);
    list.forEach(v => EX.addOneAclGroup({ ...conditions, [k]: v }, role));
    as22currentUser.push('');
  },


  addOneAclGroup(conditions, legacyRole) {
    const popCond = mustPop(conditions);
    let gnBase = '';

    function popGnPart(prefix, condKey, fmt) {
      const v = popCond('undef | ' + fmt, condKey);
      if (v === undefined) { return; }
      gnBase += prefix + v + '/';
    }

    popGnPart('svc_', 'collection', 'nonEmpty str');
    popGnPart('proj_', 'metadata.projectname', 'nonEmpty str');
    popGnPart('samm_', 'metadata.sammlung', 'pos num');
    popCond.expectEmpty('unsupported rule conditions');

    const as22roles = getOwn(translateLegacyRoles, legacyRole);
    if (!as22roles) { throw new Error('Unknown legacyRole ' + legacyRole); }
    as22roles.forEach(r => as22currentUser.push('    - '
      + JSON.stringify(gnBase + r)));
  },


};


EX.main();



export default EX;
