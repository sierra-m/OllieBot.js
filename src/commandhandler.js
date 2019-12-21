import fs from 'fs'
import Discord from 'discord.js'

class CommandHandler {
  constructor (prefix, cogs) {
    this.prefix = prefix;
    this.commands = new Discord.Collection();
    for (let cog of cogs) {
      const commandFiles = fs.readdirSync(`./commands/${cog}`).filter(file => file.endsWith('.js'));
      for (const file of commandFiles) {
        const command = require(`./commands/${cog}/${file}`);
        this.commands.set(command.name, command);
      }
    }
  }
  async handle (message) {
    if (!message.content.startsWith(this.prefix) || message.author.bot) return;

    const args = await message.content.slice(this.prefix.length).split(/ +/);
    const command = await args.shift().toLowerCase();

    try {
      await this.commands.get(command).execute(message, args);
    } catch (error) {
      await console.error(error);
      //await message.channel.send('there was an error trying to execute that command!');
    }
  }
}

export default CommandHandler