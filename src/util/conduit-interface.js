import {wrap} from 'decorator-wrap'
import StorageConduit from './storage'
import {databasePath} from '../config'

const conduit = new StorageConduit(databasePath);

function access (path, conduit: StorageConduit) {
  const stmt = conduit.prepare(path);
  return function (callback, args, name, type) {
    args.push(stmt);
    return callback();
  }
}

function update (path, conduit: StorageConduit, transactFunc=null) {
  const stmt = conduit.prepare(path);
  let transaction;
  if (transactFunc) {
    transaction = conduit.transaction(transactFunc);
  }
  return function (callback, args, name, type) {
    args.push(stmt);
    if (transaction) args.push(transaction);
    conduit.beginSave();
    const result = callback();
    conduit.endSave();
    return result;
  }
}

export default class ConduitInterface {
  constructor () {}

  conduit = conduit;

  access (path) {
    const conduit = this.conduit;
    return function (target, key, descriptor) {
      return wrap(access(path, conduit))(target, key, descriptor);
    }
  }

  update (path, transactFunc=null) {
    const conduit = this.conduit;
    return function (target, key, descriptor) {
      return wrap(update(path, conduit, transactFunc))(target, key, descriptor);
    }
  }
}