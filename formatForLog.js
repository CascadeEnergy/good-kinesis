'use strict';

const assign = require('lodash/assign');
const dispatch = require('dispatch-fn');
const identity = require('lodash/identity');
const moment = require('moment');

function formatError(error) {
  const data = error.data;
  const config = error.config;
  const dateFormat = 'YYYY-MM-DD HH:mm:ss.SSSSSS';

  if (data.event === 'error') {
    return {
      channel: `${config.system}-${config.subsystem}-${config.component}`,
      message: data.error.message,
      level: 200,
      level_name: 'ERROR',
      datetime: {
        date: moment(data.timestamp).format(dateFormat),
        timezone: 'UTC'
      },
      context: {
        processId: config.processId
      }
    };
  }
  return undefined;
}

module.exports = dispatch(formatError, identity);
