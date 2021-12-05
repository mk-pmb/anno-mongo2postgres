// -*- coding: utf-8, tab-width: 2 -*-

const copyToplevelProps = [
  'canonical',
  'collection',
  'rights',
  'via',
];


// import revisionsProps from './node_modules/@/anno-viewer/revisionsProps.js';
const revisionsProps = [
  'body',
  'created',
  'doi',
  'modified',
  'target',
  'title',
];


const mau = {

  popMeta(pop) {
    const meta = {
      mongoId: pop('_id', null),
      annotId: pop('id', null),
      createdby: pop('creator', null),
      dateCreated: pop('created', null),
      dateLastCommented: pop('_lastCommented', null),
    };
    meta.dateLastModif = pop('modified', meta.dateCreated);
    copyToplevelProps.forEach(function c(k) { meta[k] = pop(k, null); });
    return meta;
  },


  popUselessAnnoProps(pop) {
    pop.mustBe([['oneOf', 'Annotation']], 'type');
  },


  popUselessRevisionProps(pop) {
    mau.popUselessAnnoProps(pop);
    pop.mustBe('undef | str', '_lastCommented');
    pop.mustBe('undef | str', 'modified');
  },


  popRevisionKeys(pop) {
    const d = {};
    revisionsProps.forEach(function c(k) {
      const v = pop(k);
      if (v !== undefined) { d[k] = v; }
    });
    return d;
  },







};


export default mau;
