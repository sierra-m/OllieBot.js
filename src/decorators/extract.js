import wrap from './async-wrap'
import {
  matchMember,
  matchMessage,
  matchTextChannel,
  matchVoiceChannel,
  matchCategoryChannel,
  matchEmoji,
  matchInvite,
  matchColor,
  matchRole
} from "../converters"
import Extraction from '../util/extraction'
import DiscordBot from '../bot'

const extract = (pattern, strict=false) => {
  // extract {type} statements from pattern
  const subpatterns = pattern.toLowerCase().match(/{([a-z]+)}/g);
  // begin pattern with a search for command - must be standard alphabet chars
  const buildPattern = ['([A-Za-z_]+)'];
  for (let p of subpatterns) {
    if (p === '{group}') {
      // capture everything else
      buildPattern.push('(.+)$');
      break;
    } else {
      // find words or quoted sections
      buildPattern.push('("[^"]+"|[\\S]+)');
    }
  }
  // Build regex without flags. `g` flag would give incorrect match
  //const searchPattern = new RegExp(buildPattern.join(' '));

  // Decorator is not async, but wrapped return function is
  return async function (callback, args, name, type) {
    const bot: DiscordBot = args[0];
    const message = args[1];
    // args[2] contains <= 10 pre-split args
    // We ignore them and split based on pre-built `searchPattern`.
    // To conform to the pattern, the prefix is sliced out first.
    let command_args = null;
    if (strict) {
      // match only exact pattern
      const searchPattern = new RegExp(buildPattern.join(' '));
      command_args = message.content.slice(bot.prefix.length).match(searchPattern);
    } else {
      // The loop builds pattern backwards to look for partials
      for (let i = buildPattern.length - 1; i >= 1; i--) {
        // All command patterns are form: "([A-Za-z_]+) ..." so min length = 1
        // if i=1 pointing to a ("[^"]+"|[\S]+), then slice 0, 2
        const searchPattern = new RegExp(buildPattern.slice(0, i + 1).join(' '));
        command_args = message.content.slice(bot.prefix.length).match(searchPattern);
        if (command_args) break;
      }
    }

    // if no pattern match
    if (!command_args) {
      // if not strict then call it anyway
      if (!strict) {
        await callback();
      }
      return;
    }

    // A match for "command arg1 arg2" will produce:
    // ["command arg1 arg2", "command", "arg1", "arg2"]
    // So discard first 2 values
    command_args = command_args.slice(2);

    // Args may have quotes, so strip them
    command_args = command_args.map(text => text.replace(/"/g, ''));

    // Build new extraction object
    //const extraction = new Extraction(command_args, subpatterns);

    // There should now be 1 found arg per subpattern. If not, that's ok.
    for (let i = 0; i < subpatterns.length && i < command_args.length; i++) {
      // Pick out arg
      const arg = command_args[i];
      switch (subpatterns[i].replace(/[{}]/g, '')) {
        case 'string':
          args.push(arg);
          break;
        case 'number':
          args.push(Number(arg));
          break;
        case 'member':
          const member = await matchMember(message, arg);
          args.push(member);
          break;
        case 'emoji':
          const emoji = await matchEmoji(message, arg);
          args.push(emoji);
          break;
        case 'message':
          const foundMessage = await matchMessage(message, arg);
          args.push(foundMessage);
          break;
        case 'textchannel':
          const textChannel = await matchTextChannel(message, arg);
          args.push(textChannel);
          break;
        case 'voicechannel':
          const voiceChannel = await matchVoiceChannel(message, arg);
          args.push(voiceChannel);
          break;
        case 'categorychannel':
          const categoryChannel = await matchCategoryChannel(message, arg);
          args.push(categoryChannel);
          break;
        case 'role':
          const role = await matchRole(message, arg);
          args.push(role);
          break;
        case 'invite':
          const invite = await matchInvite(message, arg);
          args.push(invite);
          break;
        case 'color':
          const color = await matchColor(message, arg);
          args.push(color);
          break;
        case 'group':
          args.push(arg);
      }
    }
    await callback();
  }
};

export default function(pattern) {
  return function (target, key, descriptor) {
    return wrap(extract(pattern))(target, key, descriptor);
  }
}