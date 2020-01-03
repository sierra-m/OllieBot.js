import CommandGroup from '../util/group'
import command from '../decorators/command'
import help from '../decorators/help'
import extract from "../decorators/extract";

export default class Fun extends CommandGroup {
  @command
  @help({
    tagline: `Tell OllieBot he's good`,
    usage: ['good [optional:noun]'],
    description: `Tell OllieBot he's good`,
    examples: ['good bot']
  })
  async good (bot, message, args) {
    if (args && args[0] === 'bot') {
      await message.channel.send('good human');
    } else {
      await message.channel.send(['no u', 'U(◠﹏◠)U'].random())
    }
  }

  @command
  @extract('getmember {member}')
  async getmember (bot, message, args, extraction) {
    if (extraction) {
      await message.channel.send(`Received member ${extraction[0].mention()}`)
    } else {
      await message.channel.send('There was no extraction.')
    }
  }
}