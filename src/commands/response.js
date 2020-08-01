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
import guildOnly from '../decorators/guild-only'
import subcommand from '../decorators/subcommand'
import {extract} from "../decorators/command";
import {orderedNumerics} from "../util/tools";
import Paginator, {Pages} from "../util/paginator";

const listIcon = 'https://abs.twimg.com/emoji/v2/72x72/1f4d1.png';

export default class ResponseGroup extends CommandGroup {

  @help({
    tagline: `Manage custom responses`,
    usage: ['response list', 'response add', 'response remove'],
    description: `Get a hug for yourself or give one to someone else :blush:`,
    examples: ['hug', 'hug {mention}']
  })
  @aliases(['responses'])
  @guildOnly
  @command()
  async response (bot, message, args) {
    await message.channel.send(`You've reached the generic response answer`)
  }

  @subcommand('response')
  async list(bot, message, args) {
    const guildData = await bot.fetchGuildData(message.guild);
    const respItems = await guildData.responseLib.listEmbedFields();
    const respPages = new Pages(respItems, 6);
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
}