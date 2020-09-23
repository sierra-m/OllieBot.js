import moment from 'moment'
import Discord from 'discord.js'
import Conduit from './conduit'
import {getSafe, sleep} from './tools'

class Birthday {
  constructor (guildID, userID, timestamp: moment.Moment) {
    this.guildId = guildID;
    this.userId = userID;
    this.date = timestamp.date();
    this.month = timestamp.month();
  }

  compareDate (timestamp: moment.Moment) {
    return timestamp.date() === this.date && timestamp.month() === this.month;
  }

  asTimestamp () {
    return moment.utc({date: this.date, month: this.month})
  }
}

export default class Birthdays {
  constructor (guildID) {
    this.guildId = guildID;
    this.birthdays = [];
  }

  get (userId) {
    for (let b of this.birthdays) {
      if (b.userId === userId) return b;
    }
    return null;
  }

  @Conduit.access('select * from birthdays where guild_id=?')
  load (stmt) {
    const rows = stmt.all(this.guildId);
    for (let row of rows) {
      const timestamp = moment.unix(row.datetime).utc();
      this.birthdays.push(new Birthday(row.guild_id, row.user_id, timestamp))
    }
  }

  @Conduit.update('insert into birthdays values (?, ?, ?)')
  add (member: Discord.GuildMember, timestamp: moment.Moment, stmt) {
    timestamp = timestamp.utc();  // make sure it's utc first
    const guildId = member.guild.id;
    const userId = member.id;
    const datetime = timestamp.unix();
    const found = this.get(userId);
    if (!found) {
      stmt.run(guildId, userId, datetime);
      this.birthdays.push(new Birthday(guildId, userId, timestamp));
      return true;
    } else return false;
  }

  @Conduit.update('update birthdays set datetime=? where guild_id=? and user_id=?')
  set (member: Discord.GuildMember, timestamp: moment.Moment, stmt) {
    timestamp = timestamp.utc();  // make sure it's utc first
    const guildId = member.guild.id;
    const userId = member.id;
    const datetime = timestamp.unix();
    const found = this.get(userId);
    if (found) {
      stmt.run(datetime, guildId, userId);
      found.date = timestamp.date();
      found.month = timestamp.month();
      return true;
    } else return false;
  }

  @Conduit.update('delete from birthdays where guild_id=? and user_id=?')
  remove (member: Discord.GuildMember, stmt) {
    const guildId = member.guild.id;
    const userId = member.id;
    const found = this.get(userId);
    if (found) {
      stmt.run(guildId, userId);
      this.birthdays = this.birthdays.remove(found);
      return true;
    } else return false;
  }

  async getMatches (timestamp: moment.Moment) {
    return await this.birthdays.filter(b => b.compareDate(timestamp)).map(b => b.userId);
  }
}