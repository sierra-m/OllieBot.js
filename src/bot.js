import Discord from 'discord.js'
import CommandHandler from './commandhandler'

export default class DiscordBot {
  constructor (name: string, prefix: string, ownerID: string, options?: Object) {
    this.client = new Discord.Client(options);
    this.name = name;
    this.prefix = prefix;
    this.commandHandler = null;
    this.ownerID = ownerID;
  }

  loadCommands (groupNames: Array) {
    this.commandHandler = new CommandHandler(groupNames)
  }

  async login (token) {
    return await this.client.login(token);
  }

  async logout () {
    return await this.client.destroy();
  }
}