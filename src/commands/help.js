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
import Paginator, {InfoPage, Pages} from "../util/paginator";
import {timeout} from "../util/tools";

// ordered regional indicator numbers
const orderedNumerics = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟'];

const helpIcon = 'https://abs.twimg.com/emoji/v2/72x72/2753.png';

const commandInfo = new Discord.RichEmbed()
  .setTitle('───────────────────────')
  .setColor('#20c5d4')
  .setAuthor('Command Help', helpIcon)
  .addField(
    '__Command Syntax:__',
    `Commands follow the format
    
    \`.command <keyword arguments> [variable arguments]\`
    
    Note that \`variable arguments\` means an argument must be provided, but it can be anything. For example, in:

    \`.music <play/queue> [link/query/search number]\`

    the arguments provided in <play/queue> **must** be either play or queue, but the next argument may be either a youtube link, a query, or a search result number like so:

    \`.music play https://www.youtube.com/watch?v=tVj0ZTS4WF4\`

    To pass an argument with whitespace, surround it in double quotes like \`"some argument"\`. To learn more about the syntax of each command, call \`.help [command]\``
  );

export default class Help extends CommandGroup {
  constructor (bot) {
    super();
    this.bot = bot;
    this.helpItems = [];
    this.helpPages = null;
    this.paginator = null;
    this.loadHelp();
  }

  loadHelp () {
    for (let group : CommandGroup of this.bot.commandHandler.commandGroups) {
      const foundHelp = group.getHelp();
      if (foundHelp) {
        for (let command in foundHelp) {
          this.helpItems.push(
            {
              name: command,
              value: foundHelp[command].tagline,
              inline: false
            }
          )
        }
      }
    }

    this.helpPages = new Pages(this.helpItems, 4);
    this.paginator = new Paginator(this.helpPages, 'Help', helpIcon, '#00ff00');
    this.paginator.addInfoPage(commandInfo, 'ℹ️')
  }

  async paginateHelp (bot, message) {
    let pageNum = 1;
    let currentPage = await this.paginator.render(pageNum);
    const reactionButtons = [];
    await reactionButtons.push(...this.paginator.getInfoReactions());
    await reactionButtons.push(...orderedNumerics.slice(0, this.paginator.length));
    reactionButtons.push('❌');
    const filter = (reaction, user) => reactionButtons.includes(reaction.emoji.name) && user.id === message.author.id;
    let currentMessage = await message.author.send(currentPage);
    for (let emoji of reactionButtons) {
      await currentMessage.react(emoji);
      //await timeout(200);
    }
    try {
      while (true) {
        const collected = await currentMessage.awaitReactions(filter, {time: 15000, max:1});
        if (collected.size < 1) {
          await message.author.send('Menu timed out ❌');
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
          currentPage = await this.paginator.render(pageNum);
          currentMessage = await currentMessage.edit(currentPage);
        } else {
          currentPage = await this.paginator.renderInfo(emoji);
          currentMessage = await currentMessage.edit(currentPage);
        }
      }
    } catch (e) {
      await message.author.send('Something went wrong ❌');
    }
  }

  @command('{string}')
  async help (bot, message, args, term: string) {
    if (term) {
      for (let group : CommandGroup of bot.commandHandler.commandGroups) {
        const found = group.searchHelp(term);
        if (found) {
          /**
           * Formats to:
           * ───────────────────────
           * Description
           * `usage1`
           * `usage2`
           * Examples
           * `example1`
           * `example2`
           */
          const aliases = group.getAliases(term);

          const desc = `${found.description}
          
          ${found.usage.map(text => `\`${text}\``).join('\n')}
          
          __**Examples**__
          ${found.examples.map(text => `\`${text}\``).join('\n')}
          ${(aliases && `\n__Aliases__\n${aliases.join(', ')}`) || ''}`
            .replace(/{mention}/g, message.author.mention);

          const em = new Discord.RichEmbed()
            .setColor('#00ff00')
            .setAuthor(`${bot.prefix}${group.resolveCommand(term)}`, 'https://abs.twimg.com/emoji/v2/72x72/2753.png')
            .setTitle('───────────────────────')
            .setDescription(desc);

          await message.author.send(em);
          return
        }
      }
      await message.author.send(`No command \`${term}\` found!`);
    } else {
      await this.paginateHelp(bot, message);
    }
  }
}