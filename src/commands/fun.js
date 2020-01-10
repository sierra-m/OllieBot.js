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
import aliases from '../decorators/aliases'
import ownerOnly from '../decorators/owner-only'

export default class Fun extends CommandGroup {
  constructor () {
    super();
  }

  @help({
    tagline: `Tell OllieBot he's good`,
    usage: ['good [optional:noun]'],
    description: `Tell OllieBot he's good`,
    examples: ['good bot']
  })
  @command()
  async good (bot, message, args) {
    if (args && args[0] === 'bot') {
      await message.channel.send('good human');
    } else {
      await message.channel.send(['no u', 'U(◠﹏◠)U'].random())
    }
  }

  @help({
    tagline: `Get one or *even two* members`,
    usage: ['getmember [member1] [member2:optional] '],
    description: `Humbly informs you of the members that you passed`,
    examples: ['getmember {mention}']
  })
  @aliases(['getmembers', 'get_members'])
  @ownerOnly
  @command('{member} {member}')
  async getmember (bot, message, args, member1, member2) {
    if (member1 && member2) {
      await message.channel.send(`Received members ${member1.mention} and ${member2.mention}`)
    } else if (member1) {
      await message.channel.send(`Only received ${member1.mention}`)
    } else {
      await message.channel.send('There was no extraction.')
    }
  }
}