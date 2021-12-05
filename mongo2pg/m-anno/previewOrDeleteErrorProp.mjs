// -*- coding: utf-8, tab-width: 2 -*-

const podep = function previewOrDeleteErrorProp(trace, report) {
  const err = report.ERROR;
  if (err) {
    console.error('%s:', trace.func, err);
    const { hint } = trace;
    console.error("  ^-- offending anno's %s:", hint,
      trace.detail || report[hint]);
  } else {
    delete report.ERROR; // eslint-disable-line no-param-reassign
  }
};



export default podep;
