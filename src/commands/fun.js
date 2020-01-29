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
import wikiAPI from '../apis/wiki'

import CommandGroup from '../util/group'
import command from '../decorators/command'
import help from '../decorators/help'
import aliases from '../decorators/aliases'
import ownerOnly from '../decorators/owner-only'

import {ResolvedPage} from '../typedefs/resolved-page'

const numToRegional = {
  '0': '0⃣',
  '1': '1⃣',
  '2': '2⃣',
  '3': '3⃣',
  '4': '4⃣',
  '5': '5⃣',
  '6': '6⃣',
  '7': '7⃣',
  '8': '8⃣',
  '9': '9⃣'
};

export default class Fun extends CommandGroup {
  constructor () {
    super();
  }

  @help({
    tagline: `Tell OllieBot he's good`,
    usage: ['good [optional:noun]'],
    description: `Tell OllieBot he's good`,
    examples: ['good bot']
  })
  @command()
  async good (bot, message, args) {
    if (args && args[0] in ['bot', 'bun', 'bunny', 'ollie']) {
      await message.channel.send('good human');
    } else {
      await message.channel.send(['no u', 'U(◠﹏◠)U'].random())
    }
  }

  @help({
    tagline: `Tell OllieBot he's bad 🙁`,
    usage: ['bad [optional:noun]'],
    description: `Tell OllieBot he's bad 🙁`,
    examples: ['bad bot']
  })
  @command()
  async bad (bot, message, args) {
    if (message.author.id === '238038532369678336') {
      await message.channel.send(['good cake', 'great cake', 'i love cake'].random());
      return
    }
    if (args) {
      console.log(args[0]);
      if (args[0] in ['bot', 'bun', 'bunny', 'ollie'])
        await message.channel.send(`${message.author.mention()} bad human`);
      else if (args[0] === 'help')
        await message.channel.send(`Well I'm more help than you 😤`);
      else message.channel.send('no u');
    } else {
      await message.channel.send('no u')
    }
  }

  @help({
    tagline: `Adds some 🅱 to text`,
    usage: ['b-ify [text]'],
    description: `Adds some 🅱 to text.`,
    examples: ['b-ify OllieBot is a good boy']
  })
  @aliases(['bify', 'b-ify'])
  @command('{group}')
  async b_ify (bot, message, args, text: String) {
    let out = text.replace(/b/g, '🅱')
      .replace(/p/g, '🅱')
      .replace(/(?<=\S)gg(?=\S)/g, '🅱🅱')
      .replace(/(?<=[^\s🅱])oo(?=[^🅱])/g, '🅱🅱');

    await message.channel.send(out);
  }

  @help({
    tagline: `Converts text into regional indicators`,
    usage: ['bigtext <optional:copyable> [text]'],
    description: `Converts \`text\` into regional indicators. ` +
    `This method is case insensitive.`,
    examples: [
      'bigtext OllieBot is a good boy',
      'bigtext copyable This text is copyable'
    ]
  })
  @aliases(['big-text', 'big_text'])
  @command('{group}')
  async bigtext (bot, message, args, text: String) {
    let out = '';
    let isCopyable = false;
    //console.log(JSON.stringify(text));
    if (/copyable\s/.test(text)) {
      text = text.replace(/copyable\s/, '');
      isCopyable = true;
    }
    for (let char of text.toLowerCase()) {
      if (/[ac-z]/.test(char)) out += `:regional_indicator_${char}:`;
      else if (char === 'b') out += '🅱';
      else if (/\s/.test(char)) out += '  ';
      else if (/[0-9]/.test(char)) out += numToRegional[char];
      out += ' ';
    }

    if (isCopyable) {
      await message.channel.send(`\`\`\`\n${out}\n\`\`\``);
    } else {
      await message.channel.send(out);
    }
  }

  @help({
    tagline: `Searches Wikipedia for a term`,
    usage: ['wiki [query]'],
    description: `\`Searches Wikipedia for a term. ` +
      `This method is case insensitive`,
    examples: [
      'wiki OllieBot is a good boy',
      'wiki copyable This text is copyable'
    ]
  })
  @aliases(['wikipedia'])
  @command('{group}')
  async wiki (bot, message, args, query: String) {
    const sent = await message.channel.send(`:mag_right: :regional_indicator_w: Searching Wikipedia for \`${query}\``);
    const page : ResolvedPage = await wikiAPI.getPage(query);
    if (page) {
      const em = new Discord.RichEmbed()
        .setImage(page.image)
        .setAuthor(
          'Wikipedia',
          'https://upload.wikimedia.org/wikipedia/en/thumb/8/80/Wikipedia-logo-v2.svg/1200px-Wikipedia-logo-v2.svg.png',
          'https://www.wikipedia.org/')
        .setTitle(page.title)
        .setURL(page.url)
        .setDescription(page.summary);

      await sent.delete();
      await message.channel.send(em)
    } else {
      await sent.delete();
      await message.channel.send(`No matches for ${query}. Please be more specific :thinking:`);
    }
  }

  @help({
    tagline: `Get one or *even two* members`,
    usage: ['getmember [member1] [member2:optional] '],
    description: `Humbly informs you of the members that you passed`,
    examples: ['getmember {mention}']
  })
  @aliases(['getmembers', 'get_members'])
  @ownerOnly
  @command('{member} {member}')
  async getmember (bot, message, args, member1, member2) {
    if (member1 && member2) {
      await message.channel.send(`Received members ${member1.mention} and ${member2.mention}`)
    } else if (member1) {
      await message.channel.send(`Only received ${member1.mention}`)
    } else {
      await message.channel.send('There was no extraction.')
    }
  }
}