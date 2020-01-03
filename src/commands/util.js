import CommandGroup from '../util/group'
import command from '../decorators/command'
import help from '../decorators/help'

export default class Util extends CommandGroup {
  @command
  @help({
    tagline: `Clears a number of bot messages`,
    usage: ['clear <number>'],
    description: `Clears a number of bot messages. Limit is 20.`,
    examples: ['clear 5']
  })
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
        const channelMessages = await message.channel.fetchMessages({ limit: 100 });
        const toDelete = await channelMessages.filter(msg => msg.author.id === bot.user.id);
        try {
          await message.channel.bulkDelete([...toDelete.values()].slice(0, amount - 1))
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
}