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
import StrawPoll from '../apis/strawpoll'
import googleIt from 'google-it'
import figlet from 'figlet'
import sharp from 'sharp'
import axios from 'axios'

import CommandGroup from '../util/group'
import command, {extract} from '../decorators/command'
import help from '../decorators/help'
import aliases from '../decorators/aliases'
import ownerOnly from '../decorators/owner-only'
import moment from 'moment'
import fetch from 'node-fetch'

import {ResolvedPage} from '../typedefs/resolved-page'
import guildOnly from '../decorators/guild-only'
import {sleep, bind, truncate} from '../util/tools'

import * as emojiAlphabet from '../resources/emojiAlphabet.json'
import * as figletFontmap from '../resources/figletFontmap.json'
import modOnly from "../decorators/mod-only";
import subcommand from "../decorators/subcommand";

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

const statusColors = {
  online: '#43b581',
  idle: '#faa61a',
  offline: '#747f8d',
  dnd: '#f04747'
};

const statusTypes = {
  0: 'Playing',
  1: 'Streaming',
  2: 'Listening',
  3: 'Watching'
};

export default class Fun extends CommandGroup {
  constructor () {
    super();
  }

  @help({
    tagline: `Tell AzukiBot she's good`,
    usage: ['good (optional: [noun])'],
    description: `Tell AzukiBot she's good`,
    examples: ['good bot']
  })
  @command('{group}')
  async good (bot, message, args, text: String) {
    if (text && ['bot', 'cat', 'kitty', 'azuki'].includes(text)) {
      await message.channel.send('good human, I will spare you');
    } else {
      await message.channel.send(['no u', '(=ↀωↀ=)'].random())
    }
  }

  @help({
    tagline: `Tell AzukiBot she's bad 🙁`,
    usage: ['bad (optional: [noun])'],
    description: `Tell AzukiBot she's bad 🙁`,
    examples: ['bad bot']
  })
  @command('{group}')
  async bad (bot, message, args, text: String) {
    if (text) {
      console.log(text);
      if (['bot', 'cat', 'kitty', 'azuki'].includes(text))
        await message.channel.send(`${message.author} bad human (๑✪ᆺ✪๑)`);
      else if (text === 'help')
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
    examples: ['b-ify AzukiBot is a good kitty']
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
    usage: ['bigtext (optional: <copyable>) [text]'],
    description: `Converts \`text\` into regional indicators. ` +
    `This method is case insensitive.`,
    examples: [
      'bigtext AzukiBot is a good baby',
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
    description: `Searches Wikipedia for a term. ` +
      `This method is case insensitive`,
    examples: [
      'wiki Discord',
      'wiki Our Father Karl Marx'
    ]
  })
  @aliases(['wikipedia'])
  @command('{group}')
  async wiki (bot, message, args, query: String) {
    const sent = await message.channel.send(`:mag_right: :regional_indicator_w: Searching Wikipedia for \`${query}\``);
    const page : ResolvedPage = await wikiAPI.getPage(query);
    if (page) {
      const em = new Discord.MessageEmbed()
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
    tagline: `See when a member joined the guild`,
    usage: ['joined', 'joined [@member]'],
    description: `See when a member joined the guild. ` +
    `Calling without \`@member\` returns your own info.`,
    examples: [
      'joined',
      'joined {mention}'
    ]
  })
  @guildOnly
  @command('{member}')
  async joined (bot, message, args, member) {
    if (!member) {
      member = await message.guild.members.fetch(message.author);
    }
    const joinedAt = moment.utc(member.joinedTimestamp / 1000, 'X').format('MMMM Do[,] YYYY [at] HH:mm:ss');
    const em = new Discord.MessageEmbed()
      .setDescription(`${member.displayName} joined ${message.guild.name} on ${joinedAt} UTC`)
      .setColor('#00d114')
      .setAuthor(member.user.username, member.user.avatarURL());
    await message.channel.send(em);
  }

  @help({
    tagline: `Display a user's info`,
    usage: ['userinfo', 'userinfo [@user]'],
    description: `Display a user's info. ` +
      `Calling without \`@user\` returns your own info.`,
    examples: [
      'userinfo',
      'userinfo {mention}'
    ]
  })
  @guildOnly
  @aliases(['user-info', 'user_info', 'usrinfo'])
  @command('{member}')
  async userinfo (bot, message, args, member) {
    if (!member) {
      member = await message.guild.members.fetch(message.author);
    }
    const joinedAt = await moment.utc(member.joinedTimestamp / 1000, 'X').format('MMMM Do[,] YYYY [at] HH:mm:ss [UTC]');
    const createdAt = await moment.utc(member.user.createdTimestamp / 1000, 'X').format('MMMM Do[,] YYYY [at] HH:mm:ss [UTC]');

    const em = new Discord.MessageEmbed()
      .setTitle('════╣User Info╠════\n\u200b')
      .setAuthor(member.user.username, member.user.avatarURL())
      .setThumbnail(member.user.avatarURL())
      .setColor(statusColors[member.presence.status]);

    if (message.guild.owner.id === member.id) em.addField('Owns this server.', '\u200b', false);
    if (member.user.bot) em.addField('This user is a bot. (unlike me)', '\u200b', false);

    em.addField(`Joined __${message.guild.name}__`, joinedAt, false);
    em.addField('ID', member.id, false);
    if (member.roles.cache && member.roles.cache.size > 1) {
      // sorts them in reverse and removes first - "@everyone"
      const roles = Array.from(member.roles.cache.values());
      await roles.sort((a, b) => b.position - a.position);
      await roles.pop();
      await em.addField('Roles', roles.map(r => r.name).join(', '), false);
    } else {
      em.addField('Roles', '*None*', false);
    }
    await em.addField('Status', member.presence.status.replace(/dnd$/, 'do not disturb').replace(/^\w/, c => c.toUpperCase()), false);
    if (member.presence.status !== 'offline') {
      if (member.presence.game) {
        if (member.presence.game.name === 'Custom Status') await em.addField('Presence', member.presence.game.state, false);
        else await em.addField(statusTypes[member.presence.game.type], member.presence.game.name)
      }
    }
    em.addField('Nickname', member.nickname || '*None*', false);
    em.addField('Created', createdAt, false);

    await message.channel.send(em);
  }

  @help({
    tagline: `Roll N-sided dice`,
    usage: ['roll [iterations] d [sides] (optional:<+/-> [value]) (optional: <adv/dis>)'],
    description: `Roll N-sided dice. Whitespace is ignored.`,
    examples: ['roll d20', 'roll 3d10', 'roll 69d69 +69', 'roll d20 +3 adv']
  })
  @aliases(['dice', 'diceroll'])
  @command('{group}')
  async roll (bot, message, args, input) {
    const pattern = /(?<iters>[0-9]+)?d(?<sides>[0-9]+)(?<op>[\+\-])?(?<opnd>(?<=[\+\-])([0-9]+))?(?<favor>adv|dis)?/i;

    input = input.replace(/ /g, '');  // replace spaces
    const match = input.match(pattern);

    if (match) {
      // Sides must exist correctly
      let sides = parseInt(match.groups['sides']);
      let iters = parseInt(match.groups['iters']);
      const operator = match.groups['op'];
      let operand = parseInt(match.groups['opnd']);
      const favor = match.groups['favor'];

      // I'm not sorry about these
      // They are perfection
      sides = sides < 1 ? 1 : sides > 1000 ? 1000 : sides;
      iters = !(iters > 1) ? 1 : iters > 250 ? 250 : iters;
      operand = !(operand > 0) ? 0 : operand > 1000 ? 1000 : operand;

      if (!!favor && iters === 1) iters = 2;

      if (((sides.toString().length + 3) * iters) > 1024) {
        iters = parseInt(1024 / (sides.toString().length + 3)) - 2;
      }

      // Make the rolls
      const rolls = [];
      for (let i = 0; i < iters; i++) {
        rolls.push(Math.floor(Math.random()*sides) + 1);
      }

      // Determine subtotal
      let subtotal = 0;
      if (favor) {
        // If favor, subtotal is a max or min of all rolls
        if (favor === 'adv') subtotal = Math.max(...rolls);
        else subtotal = Math.min(...rolls);
      } else {
        // Subtotal is sum
        subtotal = rolls.reduce((a, b) => a + b, 0);
      }

      // Determine total with operator
      let total = subtotal;
      if (operator && operand) {
        if (operator === '+') total += operand;
        else total -= operand;
      }

      const em = new Discord.MessageEmbed()
        .setAuthor('Roll', 'http://moziru.com/images/dungeons-dragons-clipart-d20-12.jpg');

      const favorVerbose = {
        adv: ' with Advantage',
        dis: ' with Disadvantage'
      };
      // Build display like d20 with Advantage
      const displayRoll = `${iters === 1 || (iters === 2 && favor) ? '' : iters}d${sides}${!!favor ? favorVerbose[favor] : ''}`;

      let joined = '';
      if (favor) {
        joined = rolls.join(' | ').replace(RegExp(`\\b${subtotal}\\b`, 'g'), ` **${subtotal}** `);
      } else {
        joined = `${rolls.join(' + ')} = **${subtotal}**`;
      }
      em.addField(displayRoll, joined, false);
      //em.addBlankField();

      if (operator && operand) {
        em.addField('Modifier', `${operator} ${operand}`);
        //em.addBlankField();
      }

      em.addField('Total', total.toString());

      await message.channel.send(em);
    }
  }

  @help({
    tagline: `Fetch one to three bunnies`,
    usage: ['bun', 'bun [number]'],
    description: `Fetch a bunny, or pass a number 1-3 for several at once!!`,
    examples: ['bun', 'bun 2']
  })
  @aliases(['bunny', 'rabbit', 'bunnies', 'rabbits'])
  @command('{number}')
  async bun (bot, message, args, bunnies) {
    const getBunny = async ():Discord.MessageEmbed => {
      const result = await fetch('http://www.rabbit.org/fun/net-bunnies.html');
      if (result.status !== 200) return null;
      const raw = await result.text();
      const match = await raw.match(/Show me another photo!<\/a><br>\n<img src="(?<link>[A-Za-z0-9:_\-+./]+)"/gi);

      if (match) {
        const link_match = match[0].match(/<img src="(?<link>[A-Za-z0-9:_\-+./]+)"/i);
        return new Discord.MessageEmbed()
          .setColor('#5651ff')
          .setImage(link_match.groups.link);
      }
      return null;
    };

    if (bunnies) {
      bunnies = bind(bunnies, 1, 3);
      for (let i = 0; i < bunnies; i++) {
        const em = await getBunny();
        if (em) {
          em.setTitle(`Bun ${i+1}`);
          await message.channel.send(em);
        } else {
          await message.channel.send('Oh no! The server is having problems :(');
          return
        }
        await sleep(100);
      }

    } else {
      const em = await getBunny();
      if (em) {
        em.setTitle('Bun');
        await message.channel.send(em);
      } else {
        await message.channel.send('Oh no! The server is having problems :(');
      }
    }
  }

  @help({
    tagline: `Fetch one to three cats`,
    usage: ['cat', 'cat [number]'],
    description: `Fetch a kitty, or pass a number 1-3 for several at once!!`,
    examples: ['cat', 'cat 3']
  })
  @aliases(['cats', 'kitty', 'kitties'])
  @command('{number}')
  async cat (bot, message, args, cats) {
    const getCat = async ():Discord.MessageEmbed => {
      const result = await fetch('http://aws.random.cat/meow');
      if (result.status !== 200) return null;
      const payload = await result.json();

      return new Discord.MessageEmbed()
        .setColor('#ff7500')
        .setImage(payload.file);
    };

    if (cats) {
      cats = bind(cats, 1, 3);
      for (let i = 0; i < cats; i++) {
        const em = await getCat();
        if (em) {
          em.setTitle(`Cat ${i+1}`);
          await message.channel.send(em);
        } else {
          await message.channel.send('Oh no! The server is having problems :(');
          return
        }
        await sleep(100);
      }

    } else {
      const em = await getCat();
      if (em) {
        em.setTitle('Cat');
        await message.channel.send(em);
      } else {
        await message.channel.send('Oh no! The server is having problems :(');
      }
    }
  }

  @help({
    tagline: `Fetch one to three woofs`,
    usage: ['woof', 'woof [number]'],
    description: `Fetch a pupper, or pass a number 1-3 for several at once!!`,
    examples: ['woof', 'woof 3']
  })
  @aliases(['woof', 'pupper', 'puppers'])
  @command('{number}')
  async woof (bot, message, args, woofs) {
    const getWoof = async ():Discord.MessageEmbed => {
      const result = await fetch('https://random.dog/woof.json?include=jpg,png');
      if (result.status !== 200) return null;
      const payload = await result.json();

      return new Discord.MessageEmbed()
        .setColor('#1dba3a')
        .setImage(payload.url);
    };

    if (woofs) {
      woofs = bind(woofs, 1, 3);
      for (let i = 0; i < woofs; i++) {
        const em = await getWoof();
        if (em) {
          em.setTitle(`Woof ${i+1}`);
          await message.channel.send(em);
        } else {
          await message.channel.send('Oh no! The server is having problems :(');
          return
        }
        await sleep(100);
      }

    } else {
      const em = await getWoof();
      if (em) {
        em.setTitle('Woof');
        await message.channel.send(em);
      } else {
        await message.channel.send('Oh no! The server is having problems :(');
      }
    }
  }

  // Guild-specific so won't have a public help
  @command()
  async late (bot, message, args) {
    if (message.guild.id === '313841769441787907') return;

    const duration = moment(moment().unix() + Math.random()*[100,10000,1000000].random(), 'X').fromNow();
    await message.channel.send(`Shoe is now ${duration.substring(3)} late`)
  }

  @help({
    tagline: `Make bigtext reactions to messages`,
    usage: ['react [recent message #] [text]'],
    description: `Make bigtext reactions to messages. 
    Alternate emoji for most characters exist, but try to limit multiple occurrences of each character.
    "recent message #" means relative message number in channel, with most recent being #1, etc.`,
    examples: ['react 3 oof']
  })
  @aliases(['reaction'])
  @command('{number} {group}', {strict: true})
  async react (bot, message, args, num: number, text: string) {
    if (num < 1) num = 1;
    if (num > 30) num = 30;
    console.log(`Fetching ${num} messages`);
    const messageList = await message.channel.messages.fetch({limit: num+1});
    console.log(`Fetched ${messageList.size} messages`);
    await messageList.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    const targetMessage = messageList.first();

    const usedEmotes = [];
    const failures = [];

    const getKey = emoji => Object.keys(emojiAlphabet).find(key => {
      if (Array.isArray(emojiAlphabet[key]))
        return emojiAlphabet[key].includes(emoji);
    });

    if (targetMessage.reactions.cache.size) {
      const emojis = targetMessage.reactions.cache.map(x => x.emoji.name);
      for (let emoji of emojis) {
        // Unicode emoji have length 2
        if (emoji.length === 2) {
          usedEmotes.push(emoji);
          const char = getKey(emoji);
          if (char)
            text = text.substring(text.indexOf(char) + 1);
        }
      }
    }

    let skip = false;
    const lower = text.toLowerCase();

    for (let i = 0; i < text.length; i++) {
      if (skip) {
        skip = false;
        continue;
      }

      const pair = lower.substr(i, 2);
      if (pair.length === 2) {
        if (pair in emojiAlphabet) {
          const emoji = emojiAlphabet[pair][0];
          if (!usedEmotes.includes(emoji)) {
            try {
              await targetMessage.react(emoji);
            } catch (e) {
              failures.push(pair)
            }
            usedEmotes.push(emoji);
            skip = true;
            continue;
          }
        }
      }

      const char = lower[i];
      if (char in emojiAlphabet) {
        for (let emoji of emojiAlphabet[char]) {
          if (!usedEmotes.includes(emoji)) {
            try {
              await targetMessage.react(emoji);
            } catch (e) {
              failures.push(pair)
            }
            usedEmotes.push(emoji);
            break;
          }
        }
      }

    }

    const sent = await message.channel.send('✅');
    await sent.delete({timeout: 2000});
  }

  @help({
    tagline: `create a strawpoll.me poll`,
    usage: ['strawpoll [title] [option1] [option2] [optionN]...'],
    description: `Creates a strawpoll.me poll based on arguments given.
    Each poll must have a title and at least two options. To include spaces, wrap arguments in quotes.`,
    examples: ['strawpoll "best animal" dog cat', 'strawpoll Choose mm/dd/yyyy dd/mm/yyyy yyyy/mm/dd']
  })
  @aliases(['poll'])
  @command('{string} {group}', {removeQuotes: false})
  async strawpoll (bot, message, args, title: string, optionsPred: string) {
    title = title.replace(/"/g, '');

    const tokens = optionsPred.match(/("[^"]+"|[^\s"]+)/g);

    const options = tokens.map(token => token.replace(/"/g, ''));

    const poll = new StrawPoll({title: title, options: options});

    const success = await poll.create();

    if (success) {
      await message.channel.send(`http://www.strawpoll.me/${poll.id}`);
    } else {
      await message.channel.send('Straw Poll could not be created ¯\\_(ツ)_/¯');
    }
  }

  @help({
    tagline: `add some straya, nah yeah`,
    usage: ['straya [text]'],
    description: `Converts text to straya`,
    examples: [`straya Let's throw some shrimp on the barbie`, 'straya yes']
  })
  @aliases(['aussie'])
  @command('{group}')
  async straya (bot, message, args, text: string) {
    text = text.replace(/yeah/g, 'yeah yeah')
      .replace(/nah/g, 'nah nah')
      .replace(/yes/g, 'nah yeah')
      .replace(/no/g, 'yeah nah');

    text = text.split(' ').map(word => {
      if (!['yeah', 'nah'].includes(word)) return ['yeah', 'nah'].random();
      return word;
    }).join(' ');

    await message.channel.send(text)
  }

  @help({
    tagline: `google something`,
    usage: ['google [text]'],
    description: `Saves you a click, Google from discord`,
    examples: [`google define useful`]
  })
  @aliases(['google-it'])
  @command('{group}')
  async google (bot, message, args, text: string) {
    const results = await googleIt({query: text, limit: 5, 'no-display': true});

    const em = new Discord.MessageEmbed()
      .setAuthor('Google', 'https://storage.googleapis.com/operating-anagram-8280/favicon-32x32.png')
      .setColor('#4285F4');

    let desc = [];
    for (let result of results) {
      let snippetFormatted = result.snippet.replace(/,(?=\S)/g, '');
      desc.push(`[${truncate(result.title, 200)}](${result.link})\n${truncate(snippetFormatted, 300)}`);
    }

    em.setDescription(desc.join('\n\n'));

    await message.channel.send(em)
  }

  @help({
    tagline: `create text art`,
    usage: ['textart (optional:<font:>[some font]) [text]'],
    description: `Turn provided text into text art. Uses figlet
    fonts, see http://www.figlet.org/examples.html for a list`,
    examples: [`textart yes`, `textart font:epic no`]
  })
  @aliases(['text-art', 'text_art', 'asciiart'])
  @command('{group}')
  async textart (bot, message, args, text: string) {
    let font = 'Standard';

    const match = text.match(/(?<=font:)\S+/);
    if (match) {
      font = match[0].toLowerCase();
      if (!Object.keys(figletFontmap).includes(font)) {
        await message.channel.send(`Sorry, ${font} is not a font I have on file. Valid fonts: http://www.figlet.org/examples.html`);
        return;
      }

      text = text.replace(/font:\S+\s/, '');
    }

    figlet.text(text, {font: figletFontmap[font]}, async (err, data) => {
      if (err) {
        await message.channel.send(`Sorry, that didn't seem to work`);
      } else {
        await message.channel.send('```' + data.substr(0, 1998) + '```');
      }
    })
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

  @help({
    tagline: `Tools for working with ishihara plates`,
    usage: [
      'ishihara solve ([url] or attach image)'
    ],
    description: `Currently contains only a solver tool for ishihara plate tests, more may come`,
    examples: [
      'ishihara solve https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Ishihara_9.svg/280px-Ishihara_9.svg.png'
    ]
  })
  @aliases(['colorblind'])
  @command()
  async ishihara (bot, message, args) {
    await message.channel.send(`Please provide a sub-command: [solve]`)
  }

  @subcommand('ishihara')
  @extract('{string}')
  async solve (bot, message, args, url) {
    if (!url) {
      url = message.getMediaUrl();
      if (!url) {
        await message.channel.send('Please provide image url or attach image.');
        return;
      }
    }

    const input = (await axios({ url: url, responseType: "arraybuffer" })).data;
    const { data, info } = await sharp(input)
      // output the raw pixels
      .ensureAlpha()
      .extractChannel(3)
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;
    const pixelArray = new Uint8ClampedArray(data.buffer);

    for (let idx = 0; idx < pixelArray.length; idx += 3) {
      const channelVals = [pixelArray[idx], pixelArray[idx+1], pixelArray[idx+2]];
      // If all the same, move on to next
      if ((new Set(channelVals)).size === 1) {
        continue;
      }
      const maxChannelIdx = channelVals.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
      channelVals[maxChannelIdx] = 255;
      for (let offset = 0; offset < 3; offset += 1) {
        pixelArray[idx + offset] = channelVals[offset];
      }
    }

    await sharp(pixelArray, { raw: { width, height, channels } })
      .toFile('output.png');
    await message.channel.send({ files: [{ attachment: 'output.png' }] });
  }
}