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
    }
  }
}