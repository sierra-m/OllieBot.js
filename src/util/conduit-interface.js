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