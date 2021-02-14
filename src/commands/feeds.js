/*
* The MIT License (MIT)
*
* Copyright (c) 2021 Sierra MacLeod
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
import CommandGroup from '../util/group'
import command, { extract } from '../decorators/command'
import help from '../decorators/help'
import aliases from '../decorators/aliases'
import ownerOnly from '../decorators/owner-only'
import modOnly from '../decorators/mod-only'
import guild from "../core/guild";
import guildOnly from "../decorators/guild-only";
import subcommand from "../decorators/subcommand";
import {feedsMax} from '../config'
import logging from "../util/logging";

const youtubeIcon = 'https://www.youtube.com/s/desktop/3748dff5/img/favicon_48.png';

export default class FeedsGroup extends CommandGroup {
  @help({
    tagline: `Manage youtube feed updates in each channel`,
    usage: ['youtube-feed <add> [channel_url]', 'youtube-feed <list>', 'youtube-feed <remove> [channel_url/title]'],
    description: `Manage youtube feed updates for a particular channel. To add a feed, open the channel you 
    would like to see updates in and use the \`<add>\` subcommand. You can remove a feed using its channel link or title. 
    *Important: Due to bandwidth constraints, feeds are limited to ${feedsMax} per server*`,
    examples: [
      'youtube-feed add https://www.youtube.com/channel/UC0aanx5rpr7D1M7KCFYzrLQ',
      'youtube-feed add https://www.youtube.com/user/bkraz333',
      'youtube-feed list',
      'youtube-feed remove "Shoe0nHead"',
      'youtube-feed remove https://www.youtube.com/user/bkraz333'
    ]
  })
  @aliases(['youtube-feed', 'youtubefeed', 'youtube-feeds', 'youtubefeeds'])
  @guildOnly
  @modOnly
  @command()
  async youtube_feed (bot, message, args) {
    await message.channel.send(`Please supply an argument. Call \`${bot.prefix}help youtube-feeds\` for more info`);
  }

  @guildOnly
  @subcommand('youtube_feed')
  @extract('{string}')
  async add (bot, message, args, url) {
    const guildData = await bot.fetchGuildData(message.guild);

    if (guildData.youtubeFeeds.length() >= feedsMax) {
      await message.channel.send(`Sorry, the maximum youtube feeds count (**${feedsMax}**) has already been reached. Please 
remove one before adding another.`);
      return;
    }

    try {
      const [channelId, channelTitle] = await bot.youtubeApi.resolveChannel(url);
      if (channelId && channelTitle) {
        //logging.info(`Channel ID: ${channelId}  Channel Title: ${channelTitle}`);
        if (guildData.youtubeFeeds.hasYoutubeChannel(channelId)) {
          await message.channel.send(`Sorry, this guild already has a feed for channel **${channelTitle}** 
somewhere. Please remove it first if you would like to change the discord channel.`);
          return;
        }
        // Get last video ID - it can be null
        let lastVideoID = await bot.youtubeApi.getLastVideo(channelId);
        if (!lastVideoID)
          lastVideoID = 'none';
        //console.log(lastVideoID);

        const result = guildData.youtubeFeeds.add(channelId, message.channel.id, channelTitle, lastVideoID);

        if (result) {
          await message.channel.send(`Adding youtube feed updates for channel **${channelTitle}** to ${message.channel.toString()}`);
        } else {
          await message.channel.send(`Sorry, an unexpected error occurred 🙁 Please make sure this channel doesn't 
already have a feed and ensure the channel link is correct.`);
        }
      } else {
        await message.channel.send(`Sorry, I didn't find any channels for \`${url}\` 🙁 Make sure to provide the channel link or 
a video link from the desired channel.`);
      }
    } catch (e) {
      console.log(`Youtube API error: ${e}`);
      await message.channel.send(`Sorry, I didn't understand that 🙁 Make sure to pass a channel or video link.`);
    }
  }

  @guildOnly
  @subcommand('youtube_feed')
  async list (bot, message, args) {
    const guildData = await bot.fetchGuildData(message.guild);
    if (guildData.youtubeFeeds.length()) {
      const feedList = guildData.youtubeFeeds.asStrings();
      const em = new Discord.MessageEmbed()
        .setColor('#f7000b')
        .setDescription(feedList.join('\n'))
        .setAuthor(`Youtube Feeds`, youtubeIcon);
      await message.channel.send(em);
    } else {
      const em = new Discord.MessageEmbed()
        .setColor('#f7000b')
        .setDescription('No youtube feeds set for this guild 😕')
        .setAuthor(`Youtube Feeds`, youtubeIcon);
      await message.channel.send(em);
    }
  }

  @guildOnly
  @subcommand('youtube_feed')
  @extract('{string}')
  async remove (bot, message, args, identifier) {
    const guildData = await bot.fetchGuildData(message.guild);

    if (guildData.youtubeFeeds.length() === 0) {
      await message.channel.send(`There are no feeds to remove. 😕`);
      return;
    }

    let feed = guildData.youtubeFeeds.getByTitle(identifier);

    if (!feed) {
      try {
        const [channelId, channelTitle] = await bot.youtubeApi.resolveChannel(identifier);
        feed = guildData.youtubeFeeds.get(channelId);
        if (!feed) {
          await message.channel.send(`Sorry, that didn't match any channel url 🙁 Please make sure to provide a 
channel link or a video link from the channel`);
          return;
        }
      } catch (e) {
        logging.error('Youtube API Error', e);
        await message.channel.send(`Sorry, that didn't match any title or channel url 🙁 If providing a title  
that contains whitespace, make sure to surround it with double-quotes.`);
        return;
      }
    }

    const result = guildData.youtubeFeeds.remove(feed.youtubeChannelID);

    if (result) {
      await message.channel.send(`Removed youtube feed **${feed.channelTitle}** from <#${feed.discordChannelID}>`);
    } else {
      await message.channel.send(`This feed doesn't exist for this guild 🙁 Make sure the link or title is correct.`);
    }

  }
}