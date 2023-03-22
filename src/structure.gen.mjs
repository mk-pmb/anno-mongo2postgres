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
  ...annoAddrTypes,
  time_created: 'ts',
  author_local_userid: 'char* B',
  details: 'json',
  debug_mongo_doc_id: 'char* ? B',
  debug_doi_verified: 'char* ?',
  debug_replyto: 'char* ?',
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


console.log(pgDumpWriter.fmtCreateSimpleTable('stamps', {
  ...annoAddrTypes,
  st_type: 'char* ¹addr',
  st_at: 'ts',
  st_by: 'char*',
  st_detail: 'json ?',
}, {
  ...dfOpt,
}));



// eof
