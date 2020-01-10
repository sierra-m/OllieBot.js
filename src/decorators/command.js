/*
* The MIT License (MIT)
*
* Copyright (c) 2020 Sierra MacLeod
*
* Permission is hereby granted, free of charge, to any person obtaining a
* copy of this software and associated documentation files (the "Software"),
* to deal in the Software without restriction, including without limitation
* the rights to use, copy, modify, merge, publish, distribute, sublicense,
* and/or sell copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
* OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
* DEALINGS IN THE SOFTWARE.
*/

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
      buildPattern.push('("[^"]+"|[^\\s"]+)');
    }
  }

  const extractors = [];

  for (let p of subpatterns) {
    switch (p.replace(/[{}]/g, '')) {
      case 'string':
        extractors.push((message, arg) => arg);
        break;
      case 'number':
        extractors.push((message, arg) => Number(arg));
        break;
      case 'member':
        extractors.push(matchMember);
        break;
      case 'emoji':
        extractors.push(matchEmoji);
        break;
      case 'message':
        extractors.push(matchMessage);
        break;
      case 'textchannel':
        extractors.push(matchTextChannel);
        break;
      case 'voicechannel':
        extractors.push(matchVoiceChannel);
        break;
      case 'categorychannel':
        extractors.push(matchCategoryChannel);
        break;
      case 'role':
        extractors.push(matchRole);
        break;
      case 'invite':
        extractors.push(matchInvite);
        break;
      case 'color':
        extractors.push(matchColor);
        break;
      case 'group':
        // same as string, but separate for emphasis
        extractors.push(arg => arg);
        break;
      default:
        throw Error(`No extraction pattern of type "${p}" exists`)
    }
  }

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
        //console.log(`Using search pattern ${searchPattern}`);
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

    //console.log(`Proceeding with command args: ${command_args}`);

    // A match for "command arg1 arg2" will produce:
    // ["command arg1 arg2", "command", "arg1", "arg2"]
    // So discard first 2 values
    command_args = command_args.slice(2);

    // Args may have quotes, so strip them
    command_args = command_args.map(text => text.replace(/"/g, ''));

    // Build new extraction object
    //const extraction = new Extraction(command_args, subpatterns);

    // There should now be 1 found arg per subpattern/extractor. If not, that's ok.
    for (let i = 0; i < extractors.length && i < command_args.length; i++) {
      // Pick out arg
      const arg = command_args[i];
      const extractor = extractors[i];

      const match = await extractor(message, arg);
      args.push(match);
    }
    await callback();
  }
};

export default function(pattern, strict=false) {
  return function (target, key, descriptor) {
    if (target.commands === undefined) target.commands = [];
    if (target.aliases === undefined) target.aliases = {};
    // register this function as a command
    target.commands.push(key);

    // If pattern present then wrap it in an extract
    if (pattern) {
      return wrap(extract(pattern, strict))(target, key, descriptor);
    }
  }
}