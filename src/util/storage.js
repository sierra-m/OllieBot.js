import Database from 'better-sqlite3'

export default class StorageConduit {
  constructor (dbFilepath: string) {
    this.db = new Database(dbFilepath, { verbose: console.log });
    this.saveInProgress = false;
  }

  beginSave () {
    this.saveInProgress = true;
  }

  endSave () {
    this.saveInProgress = false;
  }

  saving () {
    return this.saveInProgress;
  }

  prepare (path) {
    return this.db.prepare(path);
  }

  transaction (func) {
    return this.db.transaction(func);
  }
}