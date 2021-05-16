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

import DiscordBot from './core/bot'
import GuildData from "./core/guild";
import handleMisc from './util/handle-misc'
import logging from './util/logging'

class CommandHandler {
  constructor (groups: Array<Class>) {
    this.commandGroups = [];
    for (let group of groups) {
      const groupClass = require(`./commands/${group}.js`).default;
      this.commandGroups.push(new groupClass());
    }
  }

  addGroup (group: Object) {
    this.commandGroups.push(group)
  }

  // Helper util to check all groups from outside, e.g. for response collisions
  hasCommand (name) {
    for (const group of this.commandGroups) {
      if (group.hasCommand(name))
        return true;
    }
    return false;
  }

  async handle (bot: DiscordBot, message) {
    //console.log(`Groups: ${this.commandGroups.map(x => x.constructor.name)}`);
    if (message.author.bot) return;

    await handleMisc(bot, message);

    // Handle new guild registering
    try {
      if (message.guild) {
        const guildData = await bot.fetchGuildData(message.guild);
        if (!guildData) {
          console.log(`No guild data for guild ${message.guild.name} ID ${message.guild.id}, adding it.`);
          const newGuildData = new GuildData(message.guild.id, {joinChannel: message.guild.systemChannelID});
          await bot.addGuildData(newGuildData);
        } else {
          // guild_data confirmed to exist so execute responses
          await guildData.responseLib.execute(bot, message);
        }
      }
    } catch (e) {
      await console.error(e);
    }

    if (!message.content.startsWith(bot.prefix)) return;

    const args = await message.content.slice(bot.prefix.length).split(/ +/, 11);
    const command = await args.shift().toLowerCase();

    // Handle blocked commands, then responses
    try {
      if (message.guild) {
        const guildData = await bot.fetchGuildData(message.guild);
        if (guildData) {
          const perms = await bot.checkMod(message.author);

          //logging.info(`command ${command} blocked stat: ${perms}`);
          if (guildData.isBlocked(command) && !perms)
            return;
        }
      }
    } catch (e) {
      await console.error(e);
    }

    try {
      for (const group of this.commandGroups) {
        if (group.hasCommand(command)) {
          if (args.length > 0) {
            const possibleSub = args[0];
            const possibleSubAlt = possibleSub.replace(/-/g, '_');

            if (group.hasSubcommand(command, possibleSub)) {
              //console.log(`Has subcommand ${possibleSub}`);
              args.shift();
              await group.executeSub(possibleSub, bot, message, args);
            } else if (group.hasSubcommand(command, possibleSubAlt)) {
              //console.log(`Has subcommand ${possibleSubAlt}`);
              args.shift();
              await group.executeSub(possibleSubAlt, bot, message, args);
            } else {
              await group.execute(command, bot, message, args);
            }
          } else {
            await group.execute(command, bot, message, args);
          }
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