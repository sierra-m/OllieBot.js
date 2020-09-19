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
import cluster from 'cluster'
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

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

Discord.Message.prototype.hasMedia = function () {
  return this.attachments.size > 0 || this.embeds.size > 0;
};

const bot = new DiscordBot('Test Mode OllieBot', '305407800778162178');
bot.loadCommands(['fun', 'util', 'admin', 'reactions', 'response']);
bot.loadHelp();

bot.client.on('ready', () => {
  console.log(`Logged in as ${bot.client.user.tag}!`);
});

bot.client.on('message', async msg => {
  await bot.commandHandler.handle(bot, msg);
});

bot.client.on('guildMemberAdd', async member => {
  const guildData = await bot.fetchGuildData(member.guild);
  const joinChannel = guildData.joinChannel;
  if (joinChannel) {
    try {
      const channel = bot.client.channels.get(joinChannel);
      const message = guildData.joinMessage.replace(/@u/gi, member.mention);
      await channel.send(message);
    } catch (e) {
      console.log(`guildMemberAdd exception:\n${e}`)
    }
  }
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

/*try {
  bot.login(token);
} catch (e) {
  if (e.message !== 'Unexpected server response: 520')  {
    bot.destroy();
  }
}*/

if (cluster.isMaster) {
  cluster.fork();

  cluster.on('exit', function(worker, code, signal) {
    if (code !== 10) {
      console.log(`A worker was murdered!! The responsibility seems to fall on ${code} ${signal} >:(`);
      bot.client.destroy();
      cluster.fork();
    } else {
      bot.client.destroy();
    }
  });
}

if (cluster.isWorker) {
  Promise.all([bot.login(token), bot.birthdayHandler()]).catch(console.log);
}