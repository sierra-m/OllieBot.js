import Discord from 'discord.js'
import CommandHandler from './commandhandler'
import ConduitInterface from './util/conduit-interface'

export default class DiscordBot { //extends ConduitInterface {
  constructor (name: string, prefix: string, ownerID: string, options?: Object) {
    //super();
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