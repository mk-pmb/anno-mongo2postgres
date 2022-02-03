// -*- coding: utf-8, tab-width: 2 -*-

const store = function storeErrorReport(how) {
  const {
    cliState,
    report,
    err,
    hint,
    detail,
  } = how;
  if (!cliState) { throw new Error('Missing cliState'); }
  if (!err) { return; }
  console.error('%s:', how.func, err);
  console.error("  ^-- offending anno's %s:", hint, detail || report[hint]);
  report.ERROR = String(err);
  cliState.errorsInTopAnnoIdxs.push(cliState.curTopAnnoIdx);
};



export default store;
