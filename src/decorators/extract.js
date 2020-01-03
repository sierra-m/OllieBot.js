import {wrap} from 'decorator-wrap'
import {matchMember} from "../converters"

const extract = (pattern) => {
  return async function (callback, args, name, type) {
    const extraction = [];

    // extract {type} statements from pattern
    const subpatterns = pattern.toLowerCase().match(/{([a-z]+)}/g);
    const command_args = args[2];
    const message = args[1];

    for (let i = 0; i < subpatterns.length && i < command_args.length; i++) {
      switch (subpatterns[i].replace(/[{}]/g, '')) {
        case 'member':
          const member = await matchMember(message, command_args[i]);
          extraction.push(member);
          break;
        case 'emoji':
          break;
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