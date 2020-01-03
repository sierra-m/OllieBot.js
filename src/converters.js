/**
 * Methods inspired by https://github.com/Rapptz/discord.py/blob/master/discord/ext/commands/converter.py
 *
 */

// matches a user id
const matchID = (arg) => arg.match(/([0-9]{15,21})$/);

const matchMemberByName = async (guild, arg) => {
  let result = null;
  if ('#' in arg) {
    const parts = arg.split('#');
    // search by discriminator
    result = await guild.members.find(member => member.user.username === parts[0] && member.user.discriminator === parts[1]);
  } else {
    // search members collection for username
    result = await guild.members.find(member => arg === member.user.username);
    if (result.length < 1) {
      // search by nickname
      result = await guild.members.find(member => arg === member.nickname)
    }
  }
  return result;
};

const matchMember = async (message, arg) => {
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

export {matchMember}