// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import mustBe from 'typechecks-pmb/must-be.js';
import objPop from 'objpop';
import promisingFs from 'fs/promises';
import readDataFile from 'read-data-file';
import uuidv5 from 'uuidv5';


import translateLegacyRoles from './legacyRoles.json';
import ubFacts from './facts.mjs';

const { annoBaseUrl } = ubFacts;
const uuidBaseUrl = annoBaseUrl + 'authors/uuidbase/';

const customUserURLs = {
  'wgd@DWork':
    'https://digi.ub.uni-heidelberg.de/wgd/index/welscher_gast.html',

  'anonymous@example.org':
    'https://www.ub.uni-heidelberg.de/',
};
const byLegacyName = {};
const byUUID = {};
const namelessUsers = [];
let as22currentUser;
const as22usersYaml = {};
const jsonTrailingNoComma = 'JSON git fix: No comma after this';

function orf(x) { return x || false; }
function mustPop(x) { return objPop(x, { mustBe }).mustBe; }


function flatMapObj(x, f) { return Object.entries(x).map(v => f(...v)); }



const EX = {

  async main() {
    const userCfg = await readDataFile('../../dumps/latest.users.yaml');
    delete userCfg['anonymous@example.org'].public.icon;
    flatMapObj(userCfg, EX.learnUser);

    byLegacyName[''] = jsonTrailingNoComma;
    byUUID[''] = jsonTrailingNoComma;
    const output = JSON.stringify({
      byLegacyName,
      byUUID,
    }, null, 2) + '\n';
    await promisingFs.writeFile('tmp.author_identities.json', output, 'UTF-8');

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
    EX.learnUserPub(agent, pop('undef | dictObj', 'public'));
    byUUID[uuid] = agent;
    byLegacyName[legacyUserName] = uuid;

    const logLineParts = [uuid, agent.type, agent.name];
    if (!agent.name) {
      agent.name = '???_NO_LEGACY_NAME_???';
      namelessUsers.push(legacyUserName);
      logLineParts.push(legacyUserName);
    }
    agent.type = EX.guessAgentType(agent);
    console.debug(logLineParts.join('\t'));

    as22currentUser = [
      'author_identities:',
      `    '${uuid}':`,
      `        'name': ${JSON.stringify(agent.name)}`,
      `        'type': ${agent.type}`,
    ];
    as22usersYaml[legacyUserName] = as22currentUser;

    const aliases = [].concat(pop('undef | ary', 'alias')).filter(Boolean);
    if (aliases.length) {
      as22currentUser.push('', 'upstream_userid_aliases:');
      aliases.forEach(function addAlias(al) {
        mustBe.nest('upstream user ID alias', al);
        byLegacyName[al] = uuid;
        as22currentUser.push('    - id: ' + JSON.stringify(al));
      });
    }

    pop('undef | eeq:"admin"', 'role');
    const rules = orf(pop('undef | ary', 'rules'));
    if (rules.length) {
      as22currentUser.push('', 'acl_user_groups:');
      rules.forEach(EX.learnOneAclEntry);
    }

    pop.expectEmpty();
  },


  learnUserPub(agent, userPub) {
    if (!userPub) { return; }
    const pop = mustPop(userPub);

    const name = pop.nest('displayName');

    pop.expectEmpty();
    Object.assign(agent, { name });
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
