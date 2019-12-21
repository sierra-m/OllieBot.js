import fs from 'fs'
import Discord from 'discord.js'
import {prefix, token} from '../config'
import CommandHandler from './commandhandler'

const client = new Discord.Client();
client.commandHandler = new CommandHandler(prefix, ['fun', 'util']);

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  if (msg.content === '.good') {
    msg.reply('no but actually you');
  }
});

client.login('');