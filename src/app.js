import Discord from 'discord.js'
import {prefix, token} from './config'
import CommandHandler from './commandhandler'
import DiscordBot from './bot'
import "regenerator-runtime/runtime"

// why isn't this a core feature smh
/*Discord.GuildMember.prototype.mention = function () {
  if (this.nickname) return `<@!${this.id}>`;
  return `<@${this.id}>`;
};*/
Object.defineProperty(Discord.GuildMember.prototype, "mention", {
  get: function mention() {
    if (this.nickname) return `<@!${this.id}>`;
    return `<@${this.id}>`;
  }
});

Object.defineProperty(Discord.User.prototype, "mention", {
  get: function mention() {
    return `<@${this.id}>`;
  }
});

const bot = new DiscordBot('Test Mode OllieBot', prefix, '305407800778162178');
bot.loadCommands(['fun', 'util', 'admin']);

// handy random util
Array.prototype.random = function () {
  return this[Math.floor((Math.random()*this.length))];
};

bot.client.on('ready', () => {
  console.log(`Logged in as ${bot.client.user.tag}!`);
});

bot.client.on('message', async msg => {
  await bot.commandHandler.handle(bot, msg);
});

try {
  bot.login(token);
} catch (e) {
  bot.destroy();
}
