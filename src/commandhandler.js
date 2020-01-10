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

import DiscordBot from './bot'

class CommandHandler {
  constructor (groups: Array) {
    this.commandGroups = [];
    for (let group of groups) {
      const groupClass = require(`./commands/${group}.js`).default;
      this.commandGroups.push(new groupClass());
    }
  }
  async handle (bot: DiscordBot, message) {
    if (!message.content.startsWith(bot.prefix) || message.author.bot) return;

    const args = await message.content.slice(bot.prefix.length).split(/ +/, 11);
    const command = await args.shift().toLowerCase();

    try {
      for (const group of this.commandGroups) {
        if (group.hasCommand(command)) {
          await group.execute(command, bot, message, args);
          return;
        }
      }
    } catch (error) {
      await console.error(error);
      //await message.channel.send('there was an error trying to execute that command!');
    }
  }
}

export default CommandHandler