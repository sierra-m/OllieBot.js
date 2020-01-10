import CommandGroup from '../util/group'
import command from '../decorators/command'
import help from '../decorators/help'
import aliases from '../decorators/aliases'
import ownerOnly from '../decorators/owner-only'

export default class Admin extends CommandGroup {
  @ownerOnly
  @command('{string}')
  async prefix (bot, message, args, newPrefix) {
    bot.prefix = newPrefix;
    await message.channel.send(`Updated prefix to ${newPrefix}`);
  }
}