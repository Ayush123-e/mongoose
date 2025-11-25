'use strict';

const clone = require('./clone');
const MongooseError = require('../error/index');

function processConnectionOptions(uri, options) {
  const opts = options ? options : {};
  const readPreference = opts.readPreference
    ? opts.readPreference
    : getUriReadPreference(uri);

  const clonedOpts = clone(opts);
  const resolvedOpts = (readPreference && readPreference !== 'primary' && readPreference !== 'primaryPreferred')
    ? resolveOptsConflicts(readPreference, clonedOpts)
    : clonedOpts;

  if (resolvedOpts.directConnection == null && isSingleServerLocalhost(uri)) {
    resolvedOpts.directConnection = true;
  }

  return resolvedOpts;
}

function resolveOptsConflicts(pref, opts) {
  // don't silently override user-provided indexing options
  if (setsIndexOptions(opts) && setsSecondaryRead(pref)) {
    throwReadPreferenceError();
  }

  // if user has not explicitly set any auto-indexing options,
  // we can silently default them all to false
  else {
    return defaultIndexOptsToFalse(opts);
  }
}

function setsIndexOptions(opts) {
  const configIdx = opts.config && opts.config.autoIndex;
  const { autoCreate, autoIndex } = opts;
  return !!(configIdx || autoCreate || autoIndex);
}

function setsSecondaryRead(prefString) {
  return !!(prefString === 'secondary' || prefString === 'secondaryPreferred');
}

function getUriReadPreference(connectionString) {
  const exp = /(?:&|\?)readPreference=(\w+)(?:&|$)/;
  const match = exp.exec(connectionString);
  return match ? match[1] : null;
}

function defaultIndexOptsToFalse(opts) {
  opts.config = { autoIndex: false };
  opts.autoCreate = false;
  opts.autoIndex = false;
  return opts;
}

function throwReadPreferenceError() {
  throw new MongooseError(
    'MongoDB prohibits index creation on connections that read from ' +
    'non-primary replicas.  Connections that set "readPreference" to "secondary" or ' +
    '"secondaryPreferred" may not opt-in to the following connection options: ' +
    'autoCreate, autoIndex'
  );
}

function isSingleServerLocalhost(uri) {
  if (typeof uri !== 'string') {
    return false;
  }

  const localhostPattern = /^mongodb:\/\/(?:[^:@]+:[^:@]+@)?(localhost|127\.0\.0\.1)(?::(\d+))?(?:\/|$)/;
  const match = uri.match(localhostPattern);

  if (!match) {
    return false;
  }

  const hostsPattern = /mongodb:\/\/(?:[^@]+@)?([^/?]+)/;
  const hostsMatch = uri.match(hostsPattern);

  if (hostsMatch && hostsMatch[1]) {
    const hosts = hostsMatch[1].split(',');
    return hosts.length === 1;
  }

  return false;
}

module.exports = processConnectionOptions;
