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
import Reactions from '../util/reactions'
import moment from 'moment'
import logging from '../util/logging'
import { sleep } from '../util/tools'

export default class DiscordBot {
  prefix;
  status;
  guilds;

  constructor (name: String, ownerID: String, youtubeApi, options?: Object) {
    this.client = new Discord.Client(options);
    this.name = name;
    this.commandHandler = null;
    this.ownerID = ownerID;
    this.guilds = new Discord.Collection();
    this.reactions = new Reactions();
    this.reactions.load();
    this.loadBotData();
    this.loadGuildData();
    this.youtubeApi = youtubeApi;
    logging.info('Loaded bot from storage.')
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
      this.guilds.set(data.id, new GuildData(data.id));
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

  registerGuild (guild: Discord.Guild) {
    this.guilds.set(guild.id, new GuildData(guild.id, {}));
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

  async fetchGuildData (guild: Discord.Guild) : GuildData {
    return await this.guilds.get(guild.id)
  }

  async fetchGuildDataById (guildId: Discord.Snowflake) : GuildData {
    return await this.guilds.get(guildId)
  }

  async addGuildData (guildID: Discord.Snowflake, guildData: GuildData) {
    await this.guilds.set(guildID, guildData);
  }
  
  async checkMod (member: Discord.GuildMember) {
    const guildData = await this.fetchGuildData(member.guild);

    if (member.id === member.guild.owner.id) return true;
    if (member.id === this.ownerID) return true;
    if (member.hasPermission("ADMINISTRATOR")) return true;
    for (let role of member.roles.cache.keys()) {
      if (guildData.hasModeRole(role)) return true;
    }
    return false;
  }

  async birthdayHandler (delay=60) {
    const choices = ['Happy Birthday to {mention}! 🎉', '{mention}, Happy Birthday!! 🎉', '🎉🎉 Happy Birthday, {mention}! 🎉🎉'];

    let prev, now;
    while (true) {
      prev = moment().utc();
      await sleep(delay * 1000);
      now = moment().utc();
      if (prev.hour() !== now.hour()) {
        logging.info(`---> Hour Crossover Event at ${now.hour()} UTC<---`);
        // 00:00 in PST, 08:00 in UTC
        if (now.hour() === 8) {
          logging.info('---> Birthday Checking Event <---');
          try {
            for (let guildData of this.guilds.array()) {
              const guild = this.client.guilds.cache.get(guildData.id);
              const channel = this.client.channels.cache.get(guildData.joinChannel);
              if (guild && channel) {
                const birthdayUsers = await guildData.matchBirthdays(now);
                for (let userId of birthdayUsers) {
                  const member = guild.members.cache.get(userId);
                  if (member) {
                    await channel.send(choices.random().replace('{mention}', member.mention));
                  }
                }
              } else {
                logging.error(`Birthdays failed for guild ${guildData.id}`)
              }
            }
          } catch (e) {
            logging.error(`Birthday checking error:`, e);
          }
        }
      }
    }
  }

  async youtubeFeedHandler (delayMinutes=30) {
    while (true) {
      logging.info('---> Youtube Feed Checking Event <---');

      for (let guildData of this.guilds.array()) {
        for (let feed of guildData.youtubeFeeds.feeds) {
          try {
            const lastVideoID = await this.youtubeApi.getLastVideo(feed.youtubeChannelID);
            if (lastVideoID !== feed.lastVideoID) {
              guildData.youtubeFeeds.updateVideo(feed.youtubeChannelID, lastVideoID);
              const channel = this.client.channels.cache.get(feed.discordChannelID);
              if (channel) {
                await channel.send(`New YouTube video for **${feed.channelTitle}**:\nhttps://www.youtube.com/watch?v=${lastVideoID}`)
              } else {
                logging.error('Youtube Feed checking error - couldn\'t find channel')
              }
            }
          } catch (e) {
            logging.error('Youtube API error', e);
          }
        }
      }

      await sleep(delayMinutes * 60 * 1000);
    }
  }
}