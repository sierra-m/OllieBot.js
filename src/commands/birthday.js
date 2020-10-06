import Discord from 'discord.js'
import moment from 'moment'

import Color from '../util/color'
import CommandGroup from '../util/group'
import command from '../decorators/command'
import help from '../decorators/help'
import aliases from '../decorators/aliases'
import guildOnly from '../decorators/guild-only'
import modOnly from '../decorators/mod-only'
import subcommand from '../decorators/subcommand'
import {extract} from '../decorators/command'

const birthdayIcon = 'https://abs-0.twimg.com/emoji/v2/72x72/1f382.png';

export default class BirthdayGroup extends CommandGroup {

  @help({
    tagline: `Manage birthdays`,
    usage: ['birthday set [@member] [date]', 'birthday <remove/get> [@member]', 'birthday <list> [date]'],
    description: `Manage and get birthdays. **add** and **remove** are mod-only`,
    examples: ['birthday', 'birthday add {mention} December 6']
  })
  @aliases(['birthdays', 'bdays', 'b-days'])
  @guildOnly
  @modOnly
  @command()
  async birthday (bot, message, args) {
    await message.channel.send('Please supply an argument.');
  }

  @guildOnly
  @subcommand('birthday')
  @extract('{member}')
  async get (bot, message, args, member) {
    if (member) {
      const guildData = await bot.fetchGuildData(message.guild);
      const found = guildData.birthdays.get(member.id);
      if (found) {
        const timestamp = found.asTimestamp();
        const em = new Discord.RichEmbed()
          .setColor('#00ff00')
          .setDescription(`${member.displayName}'s birthday is **${timestamp.format('MMMM Do')}**`)
          .setAuthor(member.user.username, member.user.avatarURL);
        await message.channel.send(em);
      } else {
        await message.channel.send(`No birthday recorded for **${member.displayName}**.`);
      }
    } else {
      await message.channel.send(`Please provide a member.`);
    }
  }

  @guildOnly
  @modOnly
  @subcommand('birthday')
  @extract('{member} {group}')
  async set (bot, message, args, member, date) {
    if (member) {
      const guildData = await bot.fetchGuildData(message.guild);
      if (date) {
        const timestamp = await moment.utc(date);
        if (timestamp.isValid()) {
          let success = guildData.birthdays.add(member, timestamp);
          if (success) {
            await message.channel.send(`Birthday for ${member.mention} set to ${timestamp.format('MMMM Do')}`);
          } else {
            success = guildData.birthdays.set(member, timestamp);
            if (success) {
              await message.channel.send(`Birthday for ${member.mention} changed to ${timestamp.format('MMMM Do')}`);
            } else
              await message.channel.send(`Couldn't update birthday for **${member.displayName}** :(`);
          }
        } else {
          await message.channel.send(`Please provide a valid date.`);
        }
      } else {
        await message.channel.send(`Please provide a date.`);
      }
    } else {
      await message.channel.send(`Please provide a member and date.`);
    }
  }

  @subcommand('birthday')
  @extract('{group}')
  async list (bot, message, args, date) {
    if (date) {
      const guildData = await bot.fetchGuildData(message.guild);
      const timestamp = await moment.utc(date);
      const found = guildData.birthdays.fromDate(timestamp);
      if (found) {
        const names = [];
        for (let b of found) {
          const member = message.guild.members.get(b.userId);
          if (member) names.push(member.mention)
        }
        if (names.length > 0) {
          const em = new Discord.RichEmbed()
            .setColor('#f70c76')
            .setDescription(names.join(', '))
            .setAuthor(`Birthdays for ${timestamp.format('MMMM Do')}`, birthdayIcon);
          await message.channel.send(em);
        } else {
          await message.channel.send(`No birthdays recorded for **${timestamp.format("MMMM Do")}**.`);
        }
      } else {
        await message.channel.send(`No birthdays recorded for **${timestamp.format("MMMM Do")}**.`);
      }
    } else {
      await message.channel.send(`Please provide a valid date.`);
    }
  }

  @subcommand('birthday')
  @extract('{member}')
  async remove (bot, message, args, member) {
    await message.channel.send('Not implemented yet.');
  }
}