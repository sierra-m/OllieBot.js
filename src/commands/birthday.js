import Discord from 'discord.js'
import moment from 'moment'

import Color from '../util/color'
import CommandGroup from '../util/group'
import command from '../decorators/command'
import help from '../decorators/help'
import aliases from '../decorators/aliases'
import guildOnly from '../decorators/guild-only'
import subcommand from '../decorators/subcommand'
import {extract} from '../decorators/command'

export default class BirthdayGroup extends CommandGroup {

  @help({
    tagline: `Manage birthdays`,
    usage: ['birthday add [@member] [date]', 'birthday <remove/get> [@member]'],
    description: `Manage and get birthdays. **add** and **remove** are mod-only`,
    examples: ['birthday', 'birthday add {mention} December 6']
  })
  @aliases(['birthdays', 'bdays', 'b-days'])
  @guildOnly
  @command()
  async birthday (bot, message, args) {
    await message.channel.send('Please supply an argument.');
  }

  @subcommand('birthday')
  @extract('{member} {group}')
  async add (bot, message, args, member, date) {
    if (date) {
      console.log(date);
      const timestamp = await moment(date);
      console.log(timestamp);
      if (timestamp) {
        await message.channel.send(`You gave me ${timestamp.format('MMMM Do YYYY, h:mm:ss a')}`);
      } else {
        await message.channel.send(`I didn't receive a date...`);
      }
    }
  }

  @subcommand('birthday')
  @extract('{member}')
  async get (bot, message, args, member) {
    await message.channel.send('Not implemented yet.');
  }

  @subcommand('birthday')
  @extract('{member}')
  async remove (bot, message, args, member) {
    await message.channel.send('Not implemented yet.');
  }
}