import wrap from './async-wrap'
import DiscordBot from "../bot";

async function ownerOnly (callback, args, name, type) {
  const bot: DiscordBot = args[0];
  const message = args[1];

  if (message.author.id === bot.ownerID) {
    await callback();
  } else {
    const m = await message.channel.send(`I'm sorry ${message.author.mention}, I'm afraid I can't do that.`);
    await m.delete(4000);
  }
}

export default function (target, key, descriptor) {
  return wrap(ownerOnly)(target, key, descriptor);
}