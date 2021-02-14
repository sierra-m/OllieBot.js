import moment from 'moment'
import Discord from 'discord.js'
import Conduit from './conduit'
import {feedsMax} from '../config';
import logging from './logging'

class YoutubeFeed {
  constructor (guildId: String,
               youtubeChannelID: String,
               discordChannelID: String,
               channelTitle: String,
               lastVideoID: String) {
    this.guildId = guildId;
    this.youtubeChannelID = youtubeChannelID;
    this.discordChannelID = discordChannelID;
    this.channelTitle = channelTitle;
    this.lastVideoID = lastVideoID;
  }

  toString () {
    return `Channel: **${this.channelTitle}**, Location: <#${this.discordChannelID}>`
  }
}

export default class YoutubeFeedsLibrary {
  constructor (guildId: String) {
    this.guildId = guildId;
    this.feeds = [];
  }

  hasYoutubeChannel (channelID: String) {
    for (let feed of this.feeds) {
      if (channelID === feed.youtubeChannelID)
        return true;
    }
    return false;
  }

  get (youtubeChannelId: String): YoutubeFeed {
    for (let feed of this.feeds) {
      if (youtubeChannelId === feed.youtubeChannelID)
        return feed;
    }
    return null;
  }

  getByTitle (channelTitle: String) {
    channelTitle = channelTitle.toLowerCase();
    for (let feed of this.feeds) {
      if (channelTitle === feed.channelTitle.toLowerCase())
        return feed;
    }
    return null;
  }

  length () {
    return this.feeds.length;
  }

  @Conduit.access('select * from youtube_feeds where guild_id=?')
  load (stmt) {
    const rows = stmt.all(this.guildId);
    for (let row of rows) {
      this.feeds.push(new YoutubeFeed(
        row.guild_id,
        row.youtube_channel_id,
        row.discord_channel_id,
        row.title,
        row.last_video_id
      ));
    }
  }

  @Conduit.update('insert into youtube_feeds values (?, ?, ?, ?, ?)')
  add (youtubeChannelID: String, discordChannelID: String, title: String, lastVideoID: String, stmt) {
    if (this.length() >= feedsMax)
      return false;
    const found = this.hasYoutubeChannel(youtubeChannelID);
    if (!found) {
      stmt.run(this.guildId, youtubeChannelID, title, lastVideoID, discordChannelID);
      this.feeds.push(new YoutubeFeed(this.guildId, youtubeChannelID, discordChannelID, title, lastVideoID));
      return true;
    } else return false;
  }

  @Conduit.update('delete from youtube_feeds where guild_id=? and youtube_channel_id=?')
  remove (youtubeChannelID: String, stmt) {
    const found = this.get(youtubeChannelID);
    if (found) {
      stmt.run(this.guildId, youtubeChannelID);
      this.feeds = this.feeds.remove(found);
      return true;
    } else return false;
  }

  @Conduit.update('update youtube_feeds set last_video_id=? where guild_id=? and youtube_channel_id=?')
  updateVideo (youtubeChannelID: String, newVideoID: String, stmt) {
    const found = this.get(youtubeChannelID);
    if (found) {
      stmt.run(newVideoID, this.guildId, youtubeChannelID);
      found.lastVideoID = newVideoID;
      return true;
    } else return false;
  }

  asStrings () {
    return this.feeds.map(feed => (feed.toString()));
  }

}