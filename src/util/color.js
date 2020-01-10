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

const colors = {
  default: 0x000000,
  white: 0xffffff,
  aqua:  0x00ffff,
  green: 0x008000,
  blue:  0x0000ff,
  purple: 0x800080,
  luminous_vivid_pink: 0xff0073,
  gold: 0xffd700,
  orange: 0xffa500,
  red: 0xff0000,
  grey: 0x808080,
  darker_grey: 0x546e7a,
  teal: 0x1abc9c,
  dark_aqua: 0x008b8b,
  dark_green: 0x1f8b4c,
  dark_blue: 0x206694,
  dark_purple: 0x71368a,
  dark_vivid_pink: 0xff1493,
  dark_gold: 0xc27c0e,
  dark_orange: 0xa84300,
  dark_red: 0x992d22,
  dark_grey: 0x607d8b,
  light_grey: 0x95a5a6,
  dark_teal: 0x11806a
};

export default class Color {
  constructor (value) {
    if (typeof value === 'string') {
      this.value = parseInt(value.replace('#', ''), 16);
      if (!this.value) {
        this.value = colors[value.toLowerCase().replace(' ', '_')];
      }
    } else if (typeof value === 'number') {
      this.value = value;
    } else if (Array.isArray(value)) {
      this.value = value[0] << 16 | value[1] << 8 | value[2];
    } else {
      throw TypeError ('Bad input argument, expected a color.')
    }
  }

  get red () {
    return this.value >> 16;
  }

  get green () {
    return (this.value & 0xff00) >> 8;
  }

  get blue () {
    return this.value & 0xff;
  }

  getArray () {
    return [this.red, this.green, this.blue];
  }
}