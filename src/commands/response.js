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
import command, {extract} from '../decorators/command'
import help from '../decorators/help'
import aliases from '../decorators/aliases'
import guildOnly from '../decorators/guild-only'
import subcommand from '../decorators/subcommand'
import modOnly from '../decorators/mod-only'
import {orderedNumerics} from "../util/tools";
import Paginator, {Pages} from "../util/paginator";
import {Response} from "../util/responses";

const listIcon = 'https://abs.twimg.com/emoji/v2/72x72/1f4d1.png';

export default class ResponseGroup extends CommandGroup {

  @help({
    tagline: `Manage custom responses`,
    usage: [
      'response list',
      'response add-text-command [name] [content]',
      'response add-image-command [name] ([url] or attach image)',
      'response add-text-keyword [name] [content]',
      'response add-image-keyword [name] ([url] or attach image)',
      'response remove [name]',
      'response edit'
    ],
    description: `Add and manage custom bot responses. When adding names with spaces please 
    enclose in double quotes. A "command" response requires the prefix \`{prefix}\` to reply, while a "keyword" 
    response does not. In text response content, use @u to replace with the mention of the member who calls it, and add 
    @ru to the end to replace those with a member argument mention called with the command`,
    examples: [
      'response list',
      'response add-text-command cat "Please someone get me a cat I am desperate"',
      'response add-keyword-image "bunny flop" https://media.giphy.com/media/j6N49PBSQ5jYk/giphy.gif'
    ]
  })
  @aliases(['responses'])
  @guildOnly
  @modOnly
  @command()
  async response (bot, message, args) {
    await message.channel.send(`Please provide a sub-command: [list, add-text-command, add-image-command, add-text-keyword, add-image-keyword, remove, edit]`)
  }

  @guildOnly
  @subcommand('response')
  async list (bot, message, args) {
    const guildData = await bot.fetchGuildData(message.guild);
    const respItems = await guildData.responseLib.listEmbedFields();
    const respPages = new Pages(respItems, 10);
    const paginator = new Paginator(respPages, 'Responses', listIcon, '#d254e3');

    let pageNum = 1;
    let currentPage = await paginator.render(pageNum);

    const reactionButtons = [];
    await reactionButtons.push(...orderedNumerics.slice(0, paginator.length));
    reactionButtons.push('❌');

    const filter = (reaction, user) => reactionButtons.includes(reaction.emoji.name) && user.id === message.author.id;
    let currentMessage = await message.channel.send(currentPage);
    for (let emoji of reactionButtons) {
      await currentMessage.react(emoji);
    }

    try {
      while (true) {
        const collected = await currentMessage.awaitReactions(filter, {time: 15000, max:1});
        if (collected.size < 1) {
          await message.channel.send('Menu timed out ❌');
          break;
        }
        const emoji = collected.first().emoji.name;
        if (emoji === '❌') {
          await currentMessage.delete();
          break;
        }
        else if (orderedNumerics.includes(emoji)) {
          // add 1 to make 1-indexed
          pageNum = orderedNumerics.indexOf(emoji) + 1;
          currentPage = await paginator.render(pageNum);
          currentMessage = await currentMessage.edit(currentPage);
        }
      }
    } catch (e) {
      await message.channel.send('Something went wrong ❌');
    }
  }

  @guildOnly
  @modOnly
  @subcommand('response')
  @extract('{string} {group}', {removeQuotes: false})
  async add_text_command (bot, message, args, name, content) {
    if (!name) {
      await message.channel.send('Please provide a name and text content.');
      return;
    }
    if (!content) {
      await message.channel.send('Please provide text content.');
      return;
    }
    if (/\s/g.test(name)) {
      await message.channel.send('Command names may not contain spaces. ❌');
      return;
    }

    name = name.replace(/"/g, '');
    if (bot.commandHandler.hasCommand(name)) {
      await message.channel.send(`Response name collides with bot command \`${name}\` ❌`);
      return;
    }

    content = content.replace(/"/, '').replace(/"$/, '');  // Remove outer quotes

    const guildData = await bot.fetchGuildData(message.guild);
    const addResp = Response.textCommand(message.guild.id, name, content);
    const success = guildData.responseLib.add(addResp);
    if (success)
      await message.channel.send(`Added text command \`${name}\` ✅`);
    else
      await message.channel.send(`Response ${name} already exists ❌`);
  }

  @guildOnly
  @modOnly
  @subcommand('response')
  @extract('{string} {group}', {removeQuotes: false})
  async add_text_keyword (bot, message, args, name, content) {
    if (!name) {
      await message.channel.send('Please provide a name and text content.');
      return;
    }
    if (!content) {
      await message.channel.send('Please provide text content.');
      return;
    }
    name = name.replace(/"/g, '');
    if (bot.commandHandler.hasCommand(name)) {
      await message.channel.send(`Response name collides with bot command \`${name}\` ❌`);
      return;
    }

    content = content.replace(/"/, '').replace(/"$/, '');  // Remove outer quotes

    const guildData = await bot.fetchGuildData(message.guild);
    const addResp = Response.textKeyword(message.guild.id, name, content);
    const success = guildData.responseLib.add(addResp);
    if (success)
      await message.channel.send(`Added text keyword \`${name}\` ✅`);
    else
      await message.channel.send(`Response ${name} already exists ❌`);
  }

  @guildOnly
  @modOnly
  @subcommand('response')
  @extract('{string} {string}')
  async add_image_command (bot, message, args, name, url) {
    if (!name) {
      await message.channel.send('Please provide a name and text content.');
      return;
    }
    if (!url) {
      url = message.getMediaUrl();
      if (!url) {
        await message.channel.send('Please provide image url or attach image.');
        return;
      }
    }
    if (/\s/g.test(name)) {
      await message.channel.send('Command names may not contain spaces. ❌');
      return;
    }
    name = name.replace(/"/g, '');
    if (bot.commandHandler.hasCommand(name)) {
      await message.channel.send(`Response name collides with bot command \`${name}\` ❌`);
      return;
    }


    const guildData = await bot.fetchGuildData(message.guild);
    const addResp = Response.imageCommand(message.guild.id, name, url);
    const success = guildData.responseLib.add(addResp);
    if (success)
      await message.channel.send(`Added image command \`${name}\` ✅`);
    else
      await message.channel.send(`Response ${name} already exists ❌`);
  }

  @guildOnly
  @modOnly
  @subcommand('response')
  @extract('{string} {string}')
  async add_image_keyword (bot, message, args, name, url) {
    if (!name) {
      await message.channel.send('Please provide a name and text content.');
      return;
    }
    if (!url) {
      url = message.getMediaUrl();
      if (!url) {
        await message.channel.send('Please provide image url or attach image.');
        return;
      }
    }
    name = name.replace(/"/g, '');
    if (bot.commandHandler.hasCommand(name)) {
      await message.channel.send(`Response name collides with bot command \`${name}\` ❌`);
      return;
    }


    const guildData = await bot.fetchGuildData(message.guild);
    const addResp = Response.imageKeyword(message.guild.id, name, url);
    const success = guildData.responseLib.add(addResp);
    if (success)
      await message.channel.send(`Added image keyword \`${name}\` ✅`);
    else
      await message.channel.send(`Response ${name} already exists ❌`);
  }

  @guildOnly
  @modOnly
  @subcommand('response')
  @extract('{string}')
  async remove (bot, message, args, name) {
    if (name) {
      const guildData = await bot.fetchGuildData(message.guild);
      const success = guildData.responseLib.remove(name);
      if (success) {
        await message.channel.send(`Removed response **${name}**.`)
      } else {
        await message.channel.send(`No response named **${name}** exists. If it contains whitespace, surround it with double-quotes.`)
      }
    } else {
      await message.channel.send('Please provide a command name to remove.')
    }
  }

  @guildOnly
  @modOnly
  @subcommand('response')
  @extract('{string}')
  async edit (bot, message, args, name) {
    await message.channel.send('Not implemented yet.')
  }
}