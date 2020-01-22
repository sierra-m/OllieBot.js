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
*
* Methods inspired by https://github.com/Rapptz/discord.py/blob/master/discord/ext/commands/converter.py
*/
import Discord from 'discord.js'
import Color from './color'
import UnicodeEmoji from './emoji'

// matches a user id
const matchID = (arg) => arg.match(/([0-9]{15,21})$/);

const matchMemberByName = async (guild, arg) => {
  let result = null;
  if (arg.includes('#')) {
    const parts = arg.split('#');
    // search by discriminator
    result = await guild.members.find(member => member.user.username === parts[0] && member.user.discriminator === parts[1]);
  } else {
    // search members collection for username
    result = await guild.members.find(member => arg === member.user.username);
    if (!result) {
      // search by nickname
      result = await guild.members.find(member => arg === member.nickname)
    }
  }
  return result;
};

const matchMember = async (message, arg): Discord.GuildMember => {
  const match = matchID(arg) || arg.match(/<@!?([0-9]+)>$/);
  let member = null;

  if (match) {
    const userID = match[1];
    if (message.guild) {
      member = await message.guild.members.find(member => member.id === userID);
    }
  } else {
    member = await matchMemberByName(message.guild, arg)
  }
  return member
};

const matchMessage = async (message, arg: String): Discord.Message => {
 const idPattern = /^(?:(?<channelID>[0-9]{15,21})-)?(?<messageID>[0-9]{15,21})$/;
 const urlPattern = /^https?:\/\/(?:(ptb|canary)\.)?discordapp\.com\/channels\/(?:([0-9]{15,21})|(@me))\/(?<channelID>[0-9]{15,21})\/(?<messageID>[0-9]{15,21})\/?$/;

 const match = arg.match(idPattern) || arg.match(urlPattern);
 if (!match) return null;

 const messageID = match.groups.messageID;
 const channelID = match.groups.channelID;

 let found = await message.channel.fetchMessage(messageID);
 if (found) return found;

 const channel = await message.client.channels.get(channelID);
 if (!channel) return null;
 return await channel.fetchMessage(messageID);
};

const matchChannel = async (message, arg: String): Discord.TextChannel => {
  const match = matchID(arg) || arg.match(/<#([0-9]+)>$/);

  let result = null;
  if (match) {
    const channelID = match[1];
    if (message.guild) result = await message.guild.channels.get(channelID);
    else result = await message.client.channels.get(channelID);
  } else {
    if (message.guild) result = await message.guild.channels.find(channel =>
      channel.name === arg
    );
    else result = await message.client.channels.find(channel =>
      channel.name === arg
    );
  }

  if (!(result instanceof Discord.TextChannel)) result = null;

  return result;
};

const matchTextChannel = async (message, arg: String): Discord.Message => {
  const result = await matchChannel(message, arg);
  if (!(result instanceof Discord.TextChannel)) return null;
  return result;
};

const matchVoiceChannel = async (message, arg: String): Discord.Message => {
  const result = await matchChannel(message, arg);
  if (!(result instanceof Discord.VoiceChannel)) return null;
  return result;
};

const matchCategoryChannel = async (message, arg: String): Discord.Message => {
  const result = await matchChannel(message, arg);
  if (!(result instanceof Discord.CategoryChannel)) return null;
  return result;
};

const matchColor = async (message, arg: String): Color => {
  try {
    return new Color(arg);
  } catch (e) {
    return null;
  }
};

const matchRole = async (message, arg: String): Discord.Role => {
  if (!message.guild) return null;

  let result = null;
  const match = matchID(arg) || arg.match(/<@&([0-9]+)>$/g);
  if (match) {
    result = await message.guild.roles.get(match[1]);
  } else {
    result = await message.guild.roles.find(role => role.name === arg);
  }
  return result;
};

const matchInvite = async (message, arg: String): Discord.Invite => {
  try {
    return await message.client.fetchInvite(arg);
  } catch (e) {
    return null;
  }
};

const matchEmoji = async (message, arg: String): Discord.Emoji | UnicodeEmoji => {
  const match = matchID(arg) || arg.match(/<a?:[a-zA-Z0-9_]+:([0-9]+)>$/);

  let result = null;
  if (match) {
    const emojiID = match[1];
    if (message.guild) result = await message.guild.emojis.get(emojiID);
    else result = await message.client.emojis.get(emojiID);
  } else {
    if (message.guild) result = await message.guild.emojis.find(emoji => emoji.name === arg);
    else result = await message.client.emojis.find(emoji => emoji.name === arg);
  }

  if (!result) {
    try {
      result = new UnicodeEmoji(arg);
    } catch (e) {}
  }

  return result;
};

export {
  matchMember,
  matchMessage,
  matchTextChannel,
  matchVoiceChannel,
  matchCategoryChannel,
  matchColor,
  matchRole,
  matchInvite,
  matchEmoji
}