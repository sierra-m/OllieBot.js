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

import Conduit from './conduit'

export default class Reactions {
  constructor () {
    this.hugs = [];
    this.pats = [];
  }

  @Conduit.access('select * from image_library')
  load (stmt) {
    const rows = stmt.all();
    for (let row of rows) {
      switch (row.type) {
        case 'hug':
          this.hugs.push(row.url);
          break;
        case 'pat':
          this.pats.push(row.url);
      }
    }
  }

  getHug () {
    return this.hugs.random();
  }

  getPat () {
    return this.pats.random();
  }

  @Conduit.update('insert into image_library values (?, ?)')
  addHug (url, stmt) {
    stmt.run('hug', url);
    this.hugs.push(url);
  }

  @Conduit.update('insert into image_library values (?, ?)')
  addPat (url, stmt) {
    stmt.run('pat', url);
    this.pats.push(url);
  }
}