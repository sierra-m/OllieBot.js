import Discord from 'discord.js'
import {ownerID} from '../config'

const extractTwitterURL = (text) => {
  let found = text.match(/(?<=vxtwitter\.com\/)[^\n?]+/i);
  if (found && found.length > 0) {
    return found[0];
  }
  found = text.match(/(?<=fixupx\.com\/)[^\n?]+/i);
  if (found && found.length > 0) {
    return found[0];
  }
}

/**
 * For handling all miscellaneous and custom behavior on each command
 * @param bot
 * @param message
 */
export default async function handleMisc (bot, message) {
  const foundTwitterURL = extractTwitterURL(message.content);
  if (foundTwitterURL) {
    const fullURL = `https://x.com/${foundTwitterURL}`
    const em = new Discord.MessageEmbed()
      .setURL(fullURL)
      .setColor('#0092d1')
      .setDescription(`Open this twitter link [here](${fullURL})`);
    await message.channel.send(em);
  }
}