import fs from 'fs'
import path from 'path'
import Discord from 'discord.js'

class CommandHandler {
  constructor (prefix, cogs) {
    this.prefix = prefix;
    this.commands = new Discord.Collection();
    console.log(__dirname);
    for (let cog of cogs) {
      const commandFiles = fs.readdirSync(path.resolve(__dirname, 'commands', cog)).filter(file => file.endsWith('.js'));
      for (const file of commandFiles) {
        const command = require(`./commands/${cog}/${file}`);
        this.commands.set(command.name, command);
      }
    }
  }
  async handle (bot, message) {
    if (!message.content.startsWith(this.prefix) || message.author.bot) return;

    const args = await message.content.slice(this.prefix.length).split(/ +/);
    const command = await args.shift().toLowerCase();

    try {
      await this.commands.get(command).execute(bot, message, args);
    } catch (error) {
      await console.error(error);
      //await message.channel.send('there was an error trying to execute that command!');
    }
  }
}

export default CommandHandler