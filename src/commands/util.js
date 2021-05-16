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

import CommandGroup from '../util/group'
import command, { extract } from '../decorators/command'
import help from '../decorators/help'
import modOnly from '../decorators/mod-only'
import guildOnly from '../decorators/guild-only'
import aliases from '../decorators/aliases'
import subcommand from "../decorators/subcommand";
import Discord from "discord.js";

const blockedIcon = 'https://abs-0.twimg.com/emoji/v2/72x72/1f6ab.png';

export default class Util extends CommandGroup {

  @help({
    tagline: `Clears a number of bot messages`,
    usage: ['clear <number>'],
    description: `Clears a number of bot messages. Limit is 20.`,
    examples: ['clear 5']
  })
  @modOnly
  @command()
  async clear (bot, message, args) {
    const member = message.guild.member(message.author);
    if (!member.hasPermission('MANAGE_MESSAGES')) {
      await message.channel.send(`no`);
      return
    }

    if (args) {
      let amount = parseInt(args[0]);
      if (!isNaN(amount)) {
        if (amount > 20) amount = 20;
        const channelMessages = await message.channel.messages.fetch({ limit: 100 });
        //console.log(`Received ${channelMessages.size}`);
        //console.log(`client user id is apparently ${bot.client.user.id}`);
        const toDelete = await channelMessages.filter(msg => msg.author.id === bot.client.user.id);
        //console.log(toDelete);

        try {
          await message.channel.bulkDelete([...toDelete.values()].slice(0, amount));
          //await message.channel.send(`Found ${toDelete.size} to delete`);
        } catch (e) {
          console.error(e);
          await message.channel.send(`I'm not allowed to do this`)
        }
      } else {
        await message.channel.send(`Amount invalid.`)
      }
    } else {
      await message.channel.send('Please supply a number to delete.')
    }
  }

  @help({
    tagline: `Clears a number of messages`,
    usage: ['purge <member/"all"> <number>'],
    description: `Clears a number of member messages. Limit is 20, default is 5. Use "all" keyword for all members`,
    examples: ['purge {mention} 5', 'purge all 5']
  })
  @guildOnly
  @modOnly
  @command('{member} {number}', false, true, false, false)
  async purge (bot, message, args, member, purgeNum) {
    if (!purgeNum) {
      purgeNum = 5;
    } else {
      purgeNum = purgeNum < 1 ? 1 : purgeNum > 20 ? 20 : purgeNum;
    }

    if (member) {
      const channelMessages = await message.channel.messages.fetch({ limit: 100 });

      let toDelete;
      //console.log(typeof member);
      if (typeof member == 'string' && member === 'all') {
        toDelete = await channelMessages.array();
        //console.log(member);
      } else {
        toDelete = await channelMessages.filter(msg => msg.author.id === member.id);
      }

      try {
        await message.channel.bulkDelete([...toDelete.values()].slice(1, purgeNum + 1));
        const sent = await message.channel.send('✅');
        await sent.delete(5000);
      } catch (e) {
        console.error(e);
        await message.channel.send(`I'm not allowed to do this`)
      }

    } else {
      await message.channel.send('Please provide a member.');
    }
  }

  @help({
    tagline: `Get/set the server's join message`,
    usage: ['joinmessage (optional:<set> [new-content])'],
    description: `Get/set the server join message. Use the identifier "@u" to use the joined member's mention`,
    examples: ['joinmessage', 'joinmessage set "Hello there @u!"']
  })
  @guildOnly
  @modOnly
  @aliases(['joinmsg', 'join-message'])
  @command('{string} {group}')
  async joinmessage (bot, message, args, command, content) {
    const guildData = await bot.fetchGuildData(message.guild);
    if (command && command === 'set') {
      if (content) {
        guildData.setJoinMessage(content);
        await message.channel.send(`Join message set to: \n\`\`\`${content}\`\`\` `);
      } else {
        await message.channel.send('Please provide new message content.');
      }
    } else {
      await message.channel.send(`Join message set to: \n\`\`\`${guildData.joinMessage}\`\`\` `);
    }
  }

  @help({
    tagline: `Get/set the server's leave message`,
    usage: ['leavemessage (optional:<set> [new-content])'],
    description: `Get/set the server leave message. Use the identifier "@u" to use the removed member's username`,
    examples: ['leavemessage', 'leavemessage set "Goodbye **@u!**"']
  })
  @guildOnly
  @modOnly
  @aliases(['leavemsg', 'leave-message'])
  @command('{string} {group}')
  async leavemessage (bot, message, args, command, content) {
    const guildData = await bot.fetchGuildData(message.guild);
    if (command && command === 'set') {
      if (content) {
        guildData.setLeaveMessage(content);
        await message.channel.send(`Leave message set to: \n\`\`\`${content}\`\`\` `);
      } else {
        await message.channel.send('Please provide new message content.');
      }
    } else {
      await message.channel.send(`Leave message set to: \n\`\`\`${guildData.leaveMessage}\`\`\` `);
    }
  }

  @help({
    tagline: `Get/set the server's leave message channel`,
    usage: ['leavechannel (optional:<set> [new-channel])'],
    description: `Get/set the server's leave message channel.`,
    examples: ['leavechannel', 'leavechannel set #general']
  })
  @guildOnly
  @modOnly
  @aliases(['leave-channel'])
  @command('{string} {textchannel}')
  async leavechannel (bot, message, args, command, channel) {
    const guildData = await bot.fetchGuildData(message.guild);
    if (command && command === 'set') {
      if (channel) {
        guildData.setLeaveChannel(channel);
        await message.channel.send(`Leave channel set to: ${channel.toString()}`);
      } else {
        await message.channel.send('Please provide new channel.');
      }
    } else {
      if (guildData.leaveChannel)
        await message.channel.send(`Leave channel set to: <#${guildData.leaveChannel}>`);
      else
        await message.channel.send(`Leave channel not set.`);
    }
  }

  @help({
    tagline: `Get/set the server's join message channel`,
    usage: ['joinchannel (optional:<set> [new-channel])'],
    description: `Get/set the server's join message channel.`,
    examples: ['joinchannel', 'joinchannel set #general']
  })
  @guildOnly
  @modOnly
  @aliases(['join-channel'])
  @command('{string} {textchannel}')
  async joinchannel (bot, message, args, command, channel) {
    const guildData = await bot.fetchGuildData(message.guild);
    if (command && command === 'set') {
      if (channel) {
        guildData.setJoinChannel(channel);
        await message.channel.send(`Join channel set to: ${channel.toString()}`);
      } else {
        await message.channel.send('Please provide new channel.');
      }
    } else {
      if (guildData.joinChannel)
        await message.channel.send(`Join channel set to: <#${guildData.joinChannel}>`);
      else
        await message.channel.send(`Join channel not set.`);
    }
  }

  @help({
    tagline: `Manage blocked commands`,
    usage: ['blocked list', 'blocked add [name]', 'blocked remove [name]'],
    description: `Add and remove blocked commands. Blocking applies to both default commands and added command responses`,
    examples: ['blocked add cat', 'blocked remove wiki']
  })
  @aliases(['blocked-command', 'blocked_command', 'blockedcommand'])
  @guildOnly
  @modOnly
  @command()
  async blocked (bot, message, args) {
    await message.channel.send('Please supply an argument.');
  }

  @guildOnly
  @subcommand('blocked')
  async list (bot, message, args) {
    const guildData = await bot.fetchGuildData(message.guild);
    if (guildData.blockedCommands.length) {
      const em = new Discord.MessageEmbed()
        .setColor('#f74a12')
        .setDescription(guildData.blockedCommands.join('\n'))
        .setAuthor(`Blocked Commands`, blockedIcon);
      await message.channel.send(em);
    } else {
      const em = new Discord.MessageEmbed()
        .setColor('#f74a12')
        .setDescription('No blocked commands set for this guild')
        .setAuthor(`Blocked Commands`, blockedIcon);
      await message.channel.send(em);
    }
  }

  @guildOnly
  @subcommand('blocked')
  @extract('{string}')
  async add (bot, message, args, name) {
    const guildData = await bot.fetchGuildData(message.guild);
    if (name) {
      try {
        guildData.addBlockedCommand(name);
        await message.channel.send(`Added **${name}** to blocked commands ✅`);
      } catch (e) {
        if (e instanceof ExistenceError)
          await message.channel.send(`Command **${name}** already blocked`);
        else
          await message.channel.send('Something went wrong :( Try again?');
      }
    } else {
      await message.channel.send('Please provide command name.');
    }
  }

  @guildOnly
  @subcommand('blocked')
  @extract('{string}')
  async remove (bot, message, args, name) {
    const guildData = await bot.fetchGuildData(message.guild);
    if (name) {
      try {
        guildData.removeBlockedCommand(name);
        await message.channel.send(`Removed **${name}** from blocked commands ✅`);
      } catch (e) {
        if (e instanceof ExistenceError)
          await message.channel.send(`Command **${name}** not blocked`);
        else
          await message.channel.send('Something went wrong :( Try again?');
      }
    } else {
      await message.channel.send('Please provide command name.');
    }
  }
}