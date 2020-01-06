import DiscordBot from './bot'

class CommandHandler {
  constructor (groups: Array) {
    this.commandGroups = [];
    for (let group of groups) {
      const groupClass = require(`./commands/${group}.js`).default;
      this.commandGroups.push(new groupClass());
    }
  }
  async handle (bot: DiscordBot, message) {
    if (!message.content.startsWith(bot.prefix) || message.author.bot) return;

    const args = await message.content.slice(bot.prefix.length).split(/ +/, 11);
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