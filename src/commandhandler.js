import fs from 'fs'
import path from 'path'
import Discord from 'discord.js'

class CommandHandler {
  constructor (prefix, groups) {
    this.prefix = prefix;
    this.commandGroups = [];
    for (let group of groups) {
      const groupClass = require(`./commands/${group}.js`).default;
      this.commandGroups.push(new groupClass());
    }
  }
  async handle (bot, message) {
    if (!message.content.startsWith(this.prefix) || message.author.bot) return;

    const args = await message.content.slice(this.prefix.length).split(/ +/);
    const command = await args.shift().toLowerCase();

    try {
      for (const group of this.commandGroups) {
        if (group.hasCommand(command)) {
          await group.execute(command, bot, message, args);
          return;
        }
      }
    } catch (error) {
      await console.error(error);
      //await message.channel.send('there was an error trying to execute that command!');
    }
  }
}

export default CommandHandler