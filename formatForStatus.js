'use strict';

const assign = require('lodash/assign');
const dispatch = require('dispatch-fn');
const identity = require('lodash/identity');

function formatError(error) {
  const data = error.data;
  const config = error.config;

  if (data.event === 'error') {
    return {
      system: config.system,
      subsystem: config.subsystem,
      component: config.component,
      version: config.version,
      processId: config.processId,
      state: 'error'
    };
  }
  return undefined;
}

function formatOps(ops) {
  const data = ops.data;
  const config = ops.config;

  if (data.event === 'ops') {
    const event = {
      system: config.system,
      subsystem: config.subsystem,
      component: config.component,
      version: config.version,
      processId: config.processId,
      state: 'idle'
    };

    if (config.devMode) {
      event.context = {activity: 'generate'};
    }

    return event;
  }
  return undefined;
}

module.exports = dispatch(formatOps, formatError, identity);
