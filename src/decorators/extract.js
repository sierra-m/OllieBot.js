import {wrap} from 'decorator-wrap'
import {matchMember} from "../converters"
import Extraction from '../util/extraction'
import DiscordBot from '../bot'

const extract = (pattern) => {
  // extract {type} statements from pattern
  const subpatterns = pattern.toLowerCase().match(/{([a-z]+)}/g);
  const buildPattern = ['([A-Za-z]+)'];
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
  const searchPattern = new RegExp(buildPattern.join(' '), 'g');

  return async function (callback, args, name, type) {
    const bot: DiscordBot = args[0];
    const message = args[1];
    // ignore pre-split arguments in args[2]
    const command_args = message.content.slice(bot.prefix.length).match(searchPattern);

    // shift out full match and command name match
    command_args.shift().shift();

    const extraction = new Extraction(command_args, subpatterns);

    for (let i = 0; i < subpatterns.length && i < command_args.length; i++) {
      const arg = command_args[i];
      switch (subpatterns[i].replace(/[{}]/g, '')) {
        case 'string':
          extraction.register(arg, arg);
          break;
        case 'number':
          extraction.register(arg, Number(arg));
          break;
        case 'member':
          const member = await matchMember(message, arg);
          extraction.register(arg, member);
          break;
        case 'emoji':
          break;
        case 'group':
          // register group by first word
          extraction.register(arg.split(' ', 1), arg)
      }
    }
    
    args.push(extraction);  // add extraction as last arg
    await callback();
  }
};

export default function(pattern) {
  return function (target, key, descriptor) {
    return wrap(extract(pattern))(target, key, descriptor);
  }
}