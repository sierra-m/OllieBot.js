import Discord from 'discord.js'
import CommandHandler from './commandhandler'

export default class DiscordBot extends Discord.Client {
  constructor (name: string, prefix: string, options?: Object) {
    super(options);
    this.name = name;
    this.prefix = prefix;
    this.commandHandler = null;
  }

  loadCommands (groupNames: Array) {
    this.commandHandler = new CommandHandler(groupNames)
  }
}