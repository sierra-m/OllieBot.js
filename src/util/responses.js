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

import Discord from "discord.js";
import Conduit from './conduit'
import Color from './color'
import {getSafe} from './tools';

const searchTypes = ['contains', 'exact', 'phrase', 'regex'];

const urlPattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

class Response {
  keyword_pattern;
  set_pattern;
  rate_timer;
  constructor (data) {
    this.guild_id = data.guild_id;
    this.name = data.name;
    this.content = data.content;
    this.is_image = getSafe(data.is_image, false);
    this.restricted = getSafe(data.restricted, false);
    this.requires_prefix = getSafe(data.requires_prefix, true);
    this.rate_limit = getSafe(data.rate_limit, 0);
    this.search_type = getSafe(data.search_type, 'phrase');
    this.search_pattern = getSafe(data.search_pattern, null);
    this.delete_after = getSafe(data.delete_after, null);

    this.rate_timer = Date.now() / 1000;

    this.updatePatterns();
  }

  // Text Command. Example: .command -> some text
  static textCommand (guild_id: string, name: string, content: string) {
    return new Response({
      guild_id: guild_id,
      name: name,
      content: content,
      requires_prefix: true
    });
  }

  // Image Command. Example: .command -> image embed
  static imageCommand (guild_id: string, name: string, imageUrl: string) {
    return new Response({
      guild_id: guild_id,
      name: name,
      content: imageUrl,
      is_image: true,
      requires_prefix: true
    });
  }

  // Text Command. Example: keyword -> some text
  static textKeyword (guild_id: string, name: string, content: string) {
    return new Response({
      guild_id: guild_id,
      name: name,
      content: content,
      requires_prefix: false,
      search_type: 'phrase'
    });
  }

  // Text Command. Example: keyword -> image embed
  static imageKeyword (guild_id: string, name: string, imageUrl: string) {
    return new Response({
      guild_id: guild_id,
      name: name,
      content: imageUrl,
      requires_prefix: false,
      search_type: 'phrase',
      is_image: true
    });
  }

  updatePatterns () {
    if (this.search_pattern) {
      // restore regex from /.../g form
      let parts = /\/(.*)\/(.*)/.exec(this.search_pattern);
      this.set_pattern = new RegExp(parts[1], parts[2]);

      this.search_type = 'regex';
    }

    switch (this.search_type) {
      case 'contains':
        this.keyword_pattern = new RegExp(this.name, 'gi');
        break;
      case 'exact':
        this.keyword_pattern = new RegExp(`^${this.name}$`, 'i');
        break;
      case 'phrase':
      case 'explicit':
        this.keyword_pattern = new RegExp(`\\b${this.name}\\b`, 'gi');
    }
  }

  test (content) {
    //console.log(`set_pattern: ${this.set_pattern}`);
    //console.log(`keyword_pattern: ${this.keyword_pattern}`);
    if (this.search_type === 'regex') {
      return this.set_pattern.test(content);
    }
    return this.keyword_pattern.test(content);
  }

  checkRateLimit () {
    if (((Date.now() / 1000) - this.rate_timer) > this.rate_limit) {
      this.rate_timer = Date.now() / 1000;
      return true;
    }
    return false;
  }
}

class ResponseLibrary {
  commands;
  keywords;
  constructor (guildId) {
    this.guildId = guildId;
    this.responses = [];
  }

  @Conduit.access('select * from responses where guild_id=?')
  load (stmt) {
    const rows = stmt.all(this.guildId);
    for (let row of rows) {
      this.responses.push(new Response(row));
    }
    this.sortResponses();
  }

  // sort for search optimization - commands search faster because single word
  sortResponses () {
    this.commands = [];
    this.keywords = [];
    for (let response of this.responses) {
      if (response.requires_prefix) this.commands.push(response);
      else this.keywords.push(response);
    }
  }

  async execute (bot, message) {
    //console.log('Checking match...');
    let matchResp = null;
    if (message.content.startsWith(bot.prefix)) {
      const command = await message.content.slice(bot.prefix.length).split(/ +/, 1);
      for (let resp of this.commands) {
        if (resp.name.toLowerCase() === command) {
          matchResp = resp;
          break;
        }
      }
    } else {
      //console.log('no prefix...');
      //console.log(`length of responses: ${this.responses.length}`);
      //console.log(`length of keywords: ${this.keywords.length}`);
      //console.log(`length of commands: ${this.commands.length}`);
      //console.log(`keywords: ${this.keywords}`);
      for (let resp of this.keywords) {
        try {
          if (resp.test(message.content)) {
            matchResp = resp;
            break;
          }
        } catch (e) {
          console.log(resp);
          throw(e);
        }
      }
    }

    if (!matchResp) return;
    //console.log('Match found');

    const authorMember = await message.guild.fetchMember(message.author);
    const auth = await bot.checkMod(authorMember);

    // Restrict to those with authorization
    if (matchResp.restricted && !auth) return;

    // If the rate limit blocks and member is not mod, fails
    if (!matchResp.checkRateLimit() && !auth) return;

    let messageSent;
    if (matchResp.is_image) {
      if (urlPattern.test(matchResp.content)) {
        const em = new Discord.RichEmbed()
          .setColor(Color.random().toString())
          .setImage(matchResp.content);
        messageSent = await message.channel.send(em);
      } else {
        messageSent = await message.channel.send(matchResp.content)
      }
    } else {
      messageSent = await message.channel.send(matchResp.content)
    }

    if (matchResp.delete_after) {
      await messageSent.delete(matchResp.delete_after * 1000);
    }
  }

  async listEmbedFields () {
    return await this.responses.map(resp => (
      {
        name: resp.name,
        value: `Type: ${resp.requires_prefix ? 'Command' : 'Keyword'} Image: ${(!!resp.is_image).toString().capitalize()}`,
        inline: false
      }
    ))
  }
}

export {ResponseLibrary, Response}