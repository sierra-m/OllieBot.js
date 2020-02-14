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

import Discord from 'discord.js'
import {prefix, token} from './config'
import DiscordBot from './core/bot'
import "regenerator-runtime/runtime"

// why isn't this a core feature smh
/*Discord.GuildMember.prototype.mention = function () {
  if (this.nickname) return `<@!${this.id}>`;
  return `<@${this.id}>`;
};*/
Object.defineProperty(Discord.GuildMember.prototype, "mention", {
  get: function mention() {
    if (this.nickname) return `<@!${this.id}>`;
    return `<@${this.id}>`;
  }
});

Object.defineProperty(Discord.User.prototype, "mention", {
  get: function mention() {
    return `<@${this.id}>`;
  }
});

// handy random util
Array.prototype.random = function () {
  return this[Math.floor((Math.random()*this.length))];
};

Array.prototype.remove = function (item) {
  return this.filter(i => i !== item);
};

const bot = new DiscordBot('Test Mode OllieBot', '305407800778162178');
bot.loadCommands(['fun', 'util', 'admin']);
bot.loadHelp();

bot.client.on('ready', () => {
  console.log(`Logged in as ${bot.client.user.tag}!`);
});

bot.client.on('message', async msg => {
  await bot.commandHandler.handle(bot, msg);
});

try {
  bot.login(token);
} catch (e) {
  bot.destroy();
}
