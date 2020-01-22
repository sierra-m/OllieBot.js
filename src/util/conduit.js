/*
* The MIT License (MIT)
*
* Copyright (c) 2020 Sierra MacLeod
*
* Permission is hereby granted, free of charge, to any person obtaining a
* copy of this software and associated documentation files (the "Software"),
* to deal in the Software without restriction, including without limitation
* the rights to use, copy, modify, merge, publish, distribute, sublicense,
* and/or sell copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
* OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
* DEALINGS IN THE SOFTWARE.
*/

import {wrap} from 'decorator-wrap'
import StorageInterface from './storage'
import {databasePath} from '../config'

const storage = new StorageInterface(databasePath);

function access (path) {
  const stmt = storage.prepare(path);
  return function (callback, args, name, type) {
    args.push(stmt);
    return callback();
  }
}

function accessMany (stmts: Object) {
  for (let prop in stmts) {
    stmts[prop][0] = storage.prepare(stmts[prop][0]);
  }
  return function (callback, args, name, type) {
    const results = {};
    for (let prop in stmts) {
      const stmt = stmts[prop][0];
      results[prop] = stmt.get(...stmts[prop].slice(1));
    }
    args.push(results);
    return callback();
  }
}

function update (path, transactFunc=null) {
  const stmt = storage.prepare(path);
  let transaction;
  if (transactFunc) {
    transaction = storage.transaction(transactFunc);
  }
  return function (callback, args, name, type) {
    args.push(stmt);
    if (transaction) args.push(transaction);
    storage.beginSave();
    const result = callback();
    storage.endSave();
    return result;
  }
}

export default class Conduit {
  constructor () {}

  static access (path) {
    return function (target, key, descriptor) {
      return wrap(access(path))(target, key, descriptor);
    }
  }

  static accessMany (stmts) {
    return function (target, key, descriptor) {
      return wrap(accessMany(stmts))(target, key, descriptor);
    }
  }

  static update (path, transactFunc=null) {
    return function (target, key, descriptor) {
      return wrap(update(path, transactFunc))(target, key, descriptor);
    }
  }
}