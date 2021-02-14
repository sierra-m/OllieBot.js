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
import {google} from 'googleapis';
import logging from '../util/logging'

export default class Youtube {
  constructor (token: String) {
    this.token = token;
    this.api = google.youtube({
      version: 'v3',
      auth: token
    });
  }

  async getChannelFromID (id: string): [String, String] {
    console.log(`Fetching channel by ID: ${id}`);
    const result = await this.api.channels.list({
      part: 'snippet',
      id: id
    });
    const channels = result.data.items;
    if (channels && channels.length > 0) {
      return [channels[0].id, channels[0].snippet.title];
    }
    return null;
  }

  async getChannelFromUsername (username: String): [String, String] {
    console.log(`Fetching channel by username: ${username}`);
    const result = await this.api.channels.list({
      part: 'snippet',
      forUsername: username
    });
    const channels = result.data.items;
    if (channels && channels.length > 0) {
      return [channels[0].id, channels[0].snippet.title];
    }
    return null;
  }

  async getChannelFromVideo (id: String): [String, String] {
    console.log(`Fetching channel by video id: ${id}`);
    const result = await this.api.videos.list({
      part: 'snippet',
      id: id
    });

    const videos = result.data.items;
    if (videos && videos.length > 0) {
      return [videos[0].snippet.channelId, videos[0].snippet.channelTitle];
    }
    return null;
  }

  async resolveChannel (url: String): [String, String] {
    // Via channel links
    let results = url.match(/(?<=youtube.com\/channel\/)(\w+)/g);
    if (results)
      return await this.getChannelFromID(results[0]);
    results = url.match(/(?<=youtube.com\/user\/)(\w+)/g);
    if (results)
      return await this.getChannelFromUsername(results[0]);
    results = url.match(/(?<=youtube.com\/c\/)(\w+)/g);
    if (results)
      return await this.getChannelFromUsername(results[0]);

    // Catch video urls
    results = url.match(/(?<=youtube.com\/watch\?v=)(\w+)/g);
    if (results)
      return await this.getChannelFromVideo(results[0]);
    results = url.match(/(?<=youtu.be\/)(\w+)/g);
    if (results)
      return await this.getChannelFromVideo(results[0]);

    // For shortened custom channel urls
    results = url.match(/(?<=youtube.com\/)(\w+)/g);
    if (results)
      return await this.getChannelFromUsername(results[0]);
  }

  async getLastVideo (channelId: String) {
    //logging.info(`Attempting video fetch for channel ${channelId}`);
    const result = await this.api.search.list({
      part: 'snippet',
      order: 'date',
      channelId: channelId,
      maxResults: 1,
      type: 'video'
    });
    //logging.info(`That worked fine`);

    const videos = result.data.items;
    if (videos && videos.length > 0) {
      return videos[0].id.videoId;
    }
    return null;
  }
}