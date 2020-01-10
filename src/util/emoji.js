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

export default class UnicodeEmoji {
  constructor (text) {
    if (text.length > 2) throw Error('Must pass single U32 unicode character.');
    this.text = text;
  }

  // extract unicode char code
  extractCode () {
    return ((((this.text.charCodeAt(0)-0xD800)*0x400) + (this.text.charCodeAt(1)-0xDC00) + 0x10000));
  };

  get url () {
    return `https://abs.twimg.com/emoji/v2/72x72/${this.extractCode().toString(16)}.png`
  }
}