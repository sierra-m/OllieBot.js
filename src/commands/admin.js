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
import CommandGroup from '../util/group'
import command from '../decorators/command'
import help from '../decorators/help'
import aliases from '../decorators/aliases'
import ownerOnly from '../decorators/owner-only'
import modOnly from '../decorators/mod-only'
import guild from "../core/guild";

export default class Admin extends CommandGroup {
  @ownerOnly
  @command('{string}')
  async prefix (bot, message, args, newPrefix) {
    bot.setPrefix(newPrefix);
    await message.channel.send(`Updated prefix to ${newPrefix}`);
  }

  @ownerOnly
  @command()
  async listguilds (bot, message: Discord.Message, args) {
    const guildIDs = bot.guilds.map(data => data.id);

    let out = `I have guild IDs **${guildIDs.join(', ')}**\n`;
    const guildNames = [];
    for (let id of guildIDs) {
      const found = bot.client.guilds.get(id);
      if (found) {
        guildNames.push(found.name);
      }
    }
    out += `These correspond to the client-cached server names **${guildNames.join(', ')}**`;

    await message.channel.send(out);
  }

  @modOnly
  @command()
  async testmodonly (bot, message, args) {
    await message.channel.send('It worked! You have permission :blush:');
  }

  @ownerOnly
  @command()
  async sleep (bot, message, args) {
    await message.channel.send('Nightie night... 🌃');
    process.exit(10);
  }

  @ownerOnly
  @command()
  async nap (bot, message, args) {
    await message.channel.send('Taking a short nap... 💤 🐰');
    process.exit(1);
  }
}