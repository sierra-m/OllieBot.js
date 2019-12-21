const name = 'good';
const tagline = `Tell OllieBot he's good`;
const usage = ['good [optional:noun]'];
const description = `Tell OllieBot he's good`;
const examples = ['good bot'];

const execute = async (bot, message, args) => {
  if (args && args[0] === 'bot') {
    await message.channel.send('good human');
  } else {
    await message.channel.send(['no u', 'U(◠﹏◠)U'].random())
  }
};

export {name, tagline, usage, description, examples, execute}