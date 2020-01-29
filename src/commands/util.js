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

import CommandGroup from '../util/group'
import command from '../decorators/command'
import help from '../decorators/help'

export default class Util extends CommandGroup {

  @help({
    tagline: `Clears a number of bot messages`,
    usage: ['clear <number>'],
    description: `Clears a number of bot messages. Limit is 20.`,
    examples: ['clear 5']
  })
  @command()
  async clear (bot, message, args) {
    const member = message.guild.member(message.author);
    if (!member.hasPermission('MANAGE_MESSAGES')) {
      await message.channel.send(`no`);
      return
    }

    if (args) {
      let amount = parseInt(args[0]);
      if (!isNaN(amount)) {
        if (amount > 20) amount = 20;
        const channelMessages = await message.channel.fetchMessages({ limit: 100 });
        const toDelete = await channelMessages.filter(msg => msg.author.id === bot.user.id);
        try {
          await message.channel.bulkDelete([...toDelete.values()].slice(0, amount - 1))
        } catch (e) {
          console.error(e);
          await message.channel.send(`I'm not allowed to do this`)
        }
      } else {
        await message.channel.send(`Amount invalid.`)
      }
    } else {
      await message.channel.send('Please supply a number to delete.')
    }
  }


}