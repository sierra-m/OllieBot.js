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
import Discord from 'discord.js'

import Color from '../util/color'
import CommandGroup from '../util/group'
import command from '../decorators/command'
import help from '../decorators/help'
import aliases from '../decorators/aliases'
import guildOnly from '../decorators/guild-only'

export default class ReactionGroup extends CommandGroup {
  @help({
    tagline: `Give yourself or someone else a hug`,
    usage: ['hug [member:optional]'],
    description: `Get a hug for yourself or give one to someone else :blush:`,
    examples: ['hug', 'hug {mention}']
  })
  @aliases(['hugs'])
  @guildOnly
  @command('{member}')
  async hug (bot, message, args, member) {
    let image = bot.reactions.getHug();
    const authorMember = await message.guild.members.fetch(message.author);

    const single_options = ['**{user}** gets a hug',
      'Here, **{user}**, have a hug',
      '*Hugs* for **{user}**',
      '**{user}**, you deserve a hug'];

    const duo_options = ['**{member}** gets a hug from **{user}**',
      '**{user}** hugs **{member}**',
      '**{user}** gives **{member}** a hug'];

    let desc = null;
    if (member) {
      desc = duo_options.random().replace('{user}', authorMember.displayName)
        .replace('{member}', member.displayName)
    } else {
      desc = single_options.random().replace('{user}', authorMember.displayName)
    }

    const em = new Discord.MessageEmbed()
      .setColor(Color.random().toString())
      .setDescription(desc)
      .setImage(image);

    await message.channel.send(em);
  }

  @help({
    tagline: `Give yourself or someone else a pat`,
    usage: ['pat [member:optional]'],
    description: `Get a pat for yourself or give one to someone else :blush:`,
    examples: ['pat', 'pat {mention}']
  })
  @aliases(['pats'])
  @guildOnly
  @command('{member}')
  async pat (bot, message, args, member) {
    let image = bot.reactions.getPat();
    const authorMember = await message.guild.members.fetch(message.author);

    const single_options = ['**{user}** gets a pat',
      'Here, **{user}**, have a pat',
      '*Headpats* for **{user}**'];

    const duo_options = ['**{member}** gets a pat from **{user}**',
      '**{user}** pats **{member}**',
      '**{user}** gives **{member}** headpats'];

    let desc = null;
    if (member) {
      desc = duo_options.random().replace('{user}', authorMember.displayName)
        .replace('{member}', member.displayName)
    } else {
      desc = single_options.random().replace('{user}', authorMember.displayName)
    }

    const em = new Discord.MessageEmbed()
      .setColor(Color.random().toString())
      .setDescription(desc)
      .setImage(image);

    await message.channel.send(em);
  }
}