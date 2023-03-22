// -*- coding: utf-8, tab-width: 2 -*-

import pgDumpWriter from 'postgres-dump-writer-helpers-220524-pmb';


console.log('-- -*- coding: UTF-8, tab-width: 2 -*-\n');

const annoAddrTypes = {
  anno_id: 'char* ¹addr',
  revision_id: 'smallint ¹addr',
};


const dfOpt = {
  tableNamePrefix: 'anno_',
};


console.log(pgDumpWriter.fmtCreateSimpleTable('data', {
  doi: 'char* ?',
  mongo_doc_id: 'char* ? B',
  ...annoAddrTypes,
  time_created: 'ts',
  author_local_userid: 'char* B',
  debug_doi_verified: 'char* ?',
  debug_replyto: 'char* ?',
  details: 'json',
}, {
  ...dfOpt,
}));


console.log(pgDumpWriter.fmtCreateSimpleTable('links', {
  ...annoAddrTypes,
  rel: 'char* ¹addr',
  url: 'char*',
}, {
  ...dfOpt,
}));
