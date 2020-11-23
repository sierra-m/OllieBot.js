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
import {matchMember} from "./converters";

const searchTypes = ['contains', 'exact', 'phrase', 'regex'];

const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
const imagePattern = /^(https?:\/\/.*\.(?:png|jpg|gif))/i;

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

  get (name) {
    for (let resp of this.responses) {
      if (resp.name === name) return resp;
    }
    return null;
  }

  @Conduit.update('insert into responses values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  add (resp: Response, stmt) {
    const found = this.get(resp.name);
    if (!found) {
      //console.log(resp);
      stmt.run(
        resp.guild_id,
        resp.name,
        resp.content,
        resp.is_image ? 1 : 0,
        resp.restricted ? 1 : 0,
        resp.requires_prefix ? 1 : 0,
        resp.rate_limit,
        resp.search_type,
        resp.search_pattern,
        resp.delete_after
      );
      this.responses.push(resp);
      this.sortResponses();
      return true;
    } else {
      return false;
    }
  }

  @Conduit.update('delete from responses where guild_id=? and name=?')
  remove (name, stmt) {
    const found = this.get(name);
    if (found) {
      stmt.run(this.guildId, found.name);
      this.responses = this.responses.remove(found);
      this.commands = this.commands.remove(found);
      this.keywords = this.keywords.remove(found);
      return true;
    } else {
      return false;
    }
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
    let matchResp = null, args;
    if (message.content.startsWith(bot.prefix)) {
      args = message.content.slice(bot.prefix.length).split(/ +/, 10);
      const command = args.shift();
      for (let resp of this.commands) {
        if (resp.name.toLowerCase() === command) {
          matchResp = resp;
          break;
        }
      }
    } else {
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

    const authorMember = await message.guild.members.fetch(message.author);
    const auth = await bot.checkMod(authorMember);

    // Restrict to those with authorization
    if (matchResp.restricted && !auth) return;

    // If the rate limit blocks and member is not mod, fails
    if (!matchResp.checkRateLimit() && !auth) return;

    const evalled = await ResponseLibrary.evalResponse(matchResp, message, args);

    let messageSent, textContent, embedContent;
    if (matchResp.is_image) {
      // match url here, not image, because it could be an image anyway
      if (urlPattern.test(matchResp.content)) {
        embedContent = matchResp.content;
      } else {
        // test image here because it's less likely a non-image url works
        if (imagePattern.test(evalled)) embedContent = evalled;
        else textContent = evalled;
      }
    } else {
      if (imagePattern.test(evalled)) embedContent = evalled;
      else textContent = evalled;
    }

    if (textContent) messageSent = await message.channel.send(textContent);
    else {
      const em = new Discord.MessageEmbed()
        .setColor(Color.random().toString())
        .setImage(embedContent);
      messageSent = await message.channel.send(em);
    }

    if (matchResp.delete_after) {
      await messageSent.delete({timeout: matchResp.delete_after * 1000});
    }
  }

  static async evalResponse (resp, message, args) : string {
    let out = resp.content;

    let replaceMember = message.author;
    if (out.endsWith('@ru')) {
      out = out.replace(/@ru/g, '');
      if (args.length > 0) {
        replaceMember = await matchMember(message, args[0]);
        if (!replaceMember) replaceMember = message.author;
      }
    }
    out = out.replace(/@u/g, replaceMember.mention);

    if (out.search(/ @r /)) {
      const choices = out.split(/ @r /g);
      out = choices.random();
    }

    return out;
  }

  async listEmbedFields () {
    return await this.responses.map(resp => (
      {
        name: resp.name,
        value: `${resp.requires_prefix ? 'Command' : 'Keyword'}${resp.is_image ? ', Image' : ''}`,
        inline: false
      }
    ))
  }
}

export {ResponseLibrary, Response}