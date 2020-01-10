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

export default class CommandGroup {
  constructor () {}

  /**
   * Check is group has command registered
   * @param name
   * @returns {boolean}
   */
  hasCommand (name) {
    return this.__proto__.commands.includes(name) || (name in this.__proto__.aliases);
  }

  /**
   * Get registered commands as array
   * @returns {Array}
   */
  getCommands () {
    return this.__proto__.commands;
  }

  /**
   * Execute a command. Does not check if requested command
   * exists, this must be done with `hasCommand`
   * @param command
   * @param bot
   * @param message
   * @param args
   * @returns {Promise<void>}
   */
  async execute (command, bot, message, args) {
    try {
      const foundOriginal = this.__proto__.aliases[command];
      if (foundOriginal) {
        await this[foundOriginal](bot, message, args);
      } else {
        await this[command](bot, message, args);
      }
    } catch (error) {
      await console.error(error);
    }
  }
}