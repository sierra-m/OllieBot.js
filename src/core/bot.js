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
import CommandHandler from '../commandhandler'
import Conduit from '../util/conduit'
import GuildData from './guild'
import help from '../commands/help'

export default class DiscordBot {
  prefix;
  status;
  guildData;

  constructor (name: string, ownerID: string, options?: Object) {
    this.client = new Discord.Client(options);
    this.name = name;
    this.commandHandler = null;
    this.ownerID = ownerID;
    this.guildData = new Discord.Collection();
    this.loadBotData();
    this.loadGuildData();
  }

  @Conduit.access('select * from bot limit 1')
  loadBotData (stmt) {
    const found = stmt.get();
    this.prefix = found.prefix;
    this.status = found.status;
  }

  @Conduit.access('select id from guild')
  loadGuildData (stmt) {
    const rows = stmt.all();
    for (let data of rows) {
      this.guildData.set(data.id, new GuildData(data.id));
    }
  }

  @Conduit.update('update bot set prefix=? where id=?')
  setPrefix (newPrefix, stmt) {
    this.prefix = newPrefix;
    stmt.run(newPrefix, this.client.user.id);
  }

  @Conduit.update('update bot set prefix=? where id=?')
  setStatus (newStatus, stmt) {
    this.status = newStatus;
    stmt.run(newStatus, this.client.user.id);
  }

  loadCommands (groupNames: Array) {
    this.commandHandler = new CommandHandler(groupNames)
  }

  loadHelp () {
    // create help object and pass bot for setup
    const group = new help(this);
    this.commandHandler.addGroup(group);
  }

  async login (token) {
    return await this.client.login(token);
  }

  async logout () {
    return await this.client.destroy();
  }
}