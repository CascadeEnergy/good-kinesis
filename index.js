'use strict';

const assign = require('lodash/assign');
const AWS = require('aws-promised');
const identity = require('lodash/identity');
const os = require('os');
const pick = require('lodash/pick');
const Squeeze = require('good-squeeze').Squeeze;

function GoodKinesis(events, config) {

  if (!(this instanceof GoodKinesis)) {
    return new GoodKinesis(events, config);
  }

  this.streamName = config.streamName;
  this.formatEvent = config.formatEvent ? config.formatEvent : identity;
  this.defaults = pick(
    config,
    ['system', 'subsystem', 'component', 'version', 'devMode']
  );
  this.squeeze = new Squeeze(events);
}

GoodKinesis.prototype.init = function(readstream, emitter, callback) {
  const metadataService = new AWS.metadataService();
  const self = this;

  metadataService
    .requestPromised('/latest/dynamic/instance-identity/document')
    .then(JSON.parse)
    .then((instanceIdentity) => {
      const awsOptions = {region: instanceIdentity.region};
      const kinesisClient = new AWS.kinesis(awsOptions);
      const squeeze = this.squeeze;

      const processId =
        `${instanceIdentity.instanceId}:${os.hostname()}:${process.pid}`;

      this.defaults.processId = processId;

      function update(data) {
        send(self.formatEvent({data: data, config: self.defaults}));
      }

      function done() {
        squeeze.removeListener('data', update);

        send(assign(self.defaults, {processId: processId, state: 'done'}));
      }

      function send(data) {
        kinesisClient.putRecordPromised(
          {
            StreamName: self.streamName,
            PartitionKey: processId,
            Data: JSON.stringify(data)
          }
        );
      }

      squeeze.on('data', update);
      emitter.on('stop', done);
      process.on('beforeExit', done);
      process.on('SIGINT', done);
      process.on('SIGTERM', done);

      readstream.pipe(squeeze);

      callback();
    });
};

GoodKinesis.attributes = {
  name: 'good-kinesis'
};

module.exports = GoodKinesis;

