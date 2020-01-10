import CommandGroup from '../util/group'
import command from '../decorators/command'
import help from '../decorators/help'
import aliases from '../decorators/aliases'
import ownerOnly from '../decorators/owner-only'

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
    if (args && args[0] === 'bot') {
      await message.channel.send('good human');
    } else {
      await message.channel.send(['no u', 'U(◠﹏◠)U'].random())
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