import Discord from 'discord.js'
import {ownerID} from '../config'

/**
 * For handling all miscellaneous and custom behavior on each command
 * @param bot
 * @param message
 */
export default async function handleMisc (bot, message) {
  // Shoe
  if (message.guild) {
    if (message.guild.id === '313841769441787907') {
      if (message.hasMedia()) {
        // disco-memes, emote submissions
        if (['498444135615692820', '607765472439697418'].includes(message.channel.id)) {
          try {
            await message.react('👍');
            await message.react('👎');
          } catch (e) {
            console.log(`Blocked reaction for UID ${message.author.id}`)
          }
        }
      }

      const uwuPattern = /\b((sex)|(cum)|(horny))\b/gi;
      if (uwuPattern.test(message.content)) {
        const badWord = message.content.match(uwuPattern)[0];
        const em = new Discord.MessageEmbed()
          .setAuthor(
            'uwu patrol',
            'https://abs-0.twimg.com/emoji/v2/72x72/1f6a8.png')
          .setURL(message.url)
          .setColor('#ff0000')
          .setDescription(`${message.author.toString()} posted the word **${badWord}** [here](${message.url})`);
        const channel = this.client.channels.cache.get('825725949844389898');
        if (channel)
          await channel.send({content: '<@&457248610367569940>', embed: em});
      }
    }
  }
}