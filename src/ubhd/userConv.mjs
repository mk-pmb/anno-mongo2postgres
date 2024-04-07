// -*- coding: utf-8, tab-width: 2 -*-

import getOwn from 'getown';
import mustBe from 'typechecks-pmb/must-be.js';
import objMapValues from 'lodash.mapvalues';
import objPop from 'objpop';
import promisingFs from 'fs/promises';
import readDataFile from 'read-data-file';
import uuidv5 from 'uuidv5';


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
const jsonTrailingNoComma = 'JSON git fix: No comma after this';


const EX = {

  async main() {
    const userCfg = await readDataFile('../../dumps/latest.users.yaml');
    delete userCfg['anonymous@example.org'].public.icon;
    Object.entries(userCfg).forEach(ent => EX.learnUser(...ent));

    byLegacyName[''] = jsonTrailingNoComma;
    byUUID[''] = jsonTrailingNoComma;
    const output = JSON.stringify({
      byLegacyName,
      byUUID,
    }, null, 2) + '\n';
    await promisingFs.writeFile('tmp.author_identities.json', output, 'UTF-8');
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
    const agent = { id: 'urn:uuid:' + uuid, name: '¿?¿?¿?' };

    const pop = objPop(userSpec, { mustBe }).mustBe;
    EX.learnUserPub(agent, pop('undef | dictObj', 'public'));
    agent.type = EX.guessAgentType(agent);
    byUUID[uuid] = agent;
    byLegacyName[legacyUserName] = uuid;
    console.debug([uuid, agent.type, agent.name].join('\t'));

    const aliases = [].concat(pop('undef | ary', 'alias')).filter(Boolean);
    aliases.forEach((al) => { byLegacyName[al] = uuid; });

    pop('undef | eeq:"admin"', 'role');
    const rules = pop('undef | ary', 'rules');
    objMapValues(rules, ([c, m]) => console.debug(' ', c, '=>', m));

    pop.expectEmpty();
  },


  learnUserPub(agent, userPub) {
    if (!userPub) { return; }
    const pop = objPop(userPub, { mustBe }).mustBe;

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


};


EX.main();



export default EX;
