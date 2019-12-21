import fs from 'fs'
import Discord from 'discord.js'
import {prefix, token} from './config'
import CommandHandler from './commandhandler'
import "regenerator-runtime/runtime";

const bot = new Discord.Client();
bot.commandHandler = new CommandHandler(prefix, ['fun', 'util']);

// handy random util
Array.prototype.random = function () {
  return this[Math.floor((Math.random()*this.length))];
};

bot.on('ready', () => {
  console.log(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', async msg => {
  await bot.commandHandler.handle(bot, msg);
});

bot.login(token);