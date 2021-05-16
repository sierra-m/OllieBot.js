import Conduit from '../util/conduit'
import Discord from 'discord.js'
import Birthdays from '../util/birthdays'
import RateLimit from '../util/rate-limit'
import {ExistenceError} from '../util/errors'
import {Statement} from '../typedefs/statement'
import {ResponseLibrary} from '../util/responses'
import YoutubeFeedsLibrary from '../util/youtube-feeds'
import { getSafe, sleep } from '../util/tools'
import moment from "moment"

type GuildOptions = Object;

export default class GuildData {
  id;
  created = false;

  constructor (id: String, options: GuildOptions = null) {
    this.id = id;
    this.responseLib = new ResponseLibrary(id);
    this.birthdays = new Birthdays(id);
    this.youtubeFeeds = new YoutubeFeedsLibrary(id);

    this.joinChannel = '';
    this.joinMessage = '';
    this.leaveChannel = '';
    this.leaveMessage = '';
    this.musicChannel = '';
    this.defaultRole = '';
    this.auditChannel = '';
    this.modRoles = [];
    this.blockedCommands = [];
    this.rateLimits = [];

    if (options) {
      this.joinChannel = getSafe(options.joinChannel, null);
      this.joinMessage = getSafe(options.joinMessage, '');
      this.leaveChannel = getSafe(options.leaveChannel, null);
      this.leaveMessage = getSafe(options.leaveMessage, '');
      this.musicChannel = getSafe(options.musicChannel, null);
      this.defaultRole = getSafe(options.defaultRole, null);
      this.auditChannel = getSafe(options.auditChannel, null);
      this.create();
      this.created = true;
    } else {
      this.loadData();
      this.loadModRoles();
      this.loadBlockedCommands();
      this.responseLib.load();
      this.birthdays.load();
      this.youtubeFeeds.load();
      this.created = true;
    }
  }

  @Conduit.access('select * from guild where id=?')
  loadData (stmt) {
    const data = stmt.get(this.id);
    this.joinChannel = data.join_channel;
    this.joinMessage = data.join_message;
    this.leaveChannel = data.leave_channel;
    this.leaveMessage = data.leave_message;
    this.musicChannel = data.music_channel;
    this.defaultRole = data.default_role;
    this.auditChannel = data.audit_channel;
  }

  @Conduit.update('insert into guild values (?, ?, ?, ?, ?, ?, ?, ?)')
  create (stmt) {
    if (this.created) {
      throw new Error('Guild already created.')
    }
    stmt.run(
      this.id,
      this.joinChannel,
      this.joinMessage,
      this.leaveChannel,
      this.leaveMessage,
      this.musicChannel,
      this.defaultRole,
      this.auditChannel
    )
  }

  @Conduit.access('select role_id from mod_roles where guild_id=?')
  loadModRoles (stmt: Statement) {
    const rows : Array = stmt.all(this.id);
    this.modRoles = rows.map(data => data.role_id);
  }

  @Conduit.update('insert into mod_roles values (?, ?)')
  addModRole (role: Discord.Snowflake, stmt: Statement) {
    if (role in this.modRoles) {
      throw new ExistenceError(`Role '${role}' is already a mode role`)
    }
    this.modRoles.push(role);
    stmt.run(this.id, role);
  }

  @Conduit.update('delete from mod_roles where guild_id=? and role_id=?')
  removeModRole (role: Discord.Snowflake, stmt: Statement) {
    if (!(role in this.modRoles)) {
      throw new ExistenceError(`Role '${role}' is not a mod role`)
    }
    this.modRoles = this.modRoles.remove(role);
    stmt.run(this.id, role);
  }

  @Conduit.access('select command from blocked_commands where guild_id=?')
  loadBlockedCommands (stmt: Statement) {
    const rows : Array = stmt.all(this.id);
    this.blockedCommands = rows.map(data => data.command);
  }

  @Conduit.update('insert into blocked_commands values (?, ?)')
  addBlockedCommand (command: String, stmt: Statement) {
    if (this.blockedCommands.includes(command)) {
      throw new ExistenceError(`Command '${command}' is already blocked`)
    }
    this.blockedCommands.push(command);
    stmt.run(this.id, command);
  }

  @Conduit.update('delete from blocked_commands where guild_id=? and command=?')
  removeBlockedCommand (command: String, stmt: Statement) {
    if (!(this.blockedCommands.includes(command))) {
      throw new ExistenceError(`Command '${command}' is not blocked`)
    }
    this.blockedCommands.remove(command);
    stmt.run(this.id, command);
  }

  @Conduit.update('update guild set join_channel=? where id=?')
  setJoinChannel(channel: Discord.TextChannel, stmt: Statement) {
    this.joinChannel = channel.id;
    stmt.run(channel.id, this.id);
  }

  @Conduit.update('update guild set join_message=? where id=?')
  setJoinMessage(message: String, stmt: Statement) {
    this.joinMessage = message;
    stmt.run(message, this.id);
  }

  @Conduit.update('update guild set leave_channel=? where id=?')
  setLeaveChannel(channel: Discord.TextChannel, stmt: Statement) {
    this.leaveChannel = channel.id;
    stmt.run(channel.id, this.id);
  }

  @Conduit.update('update guild set leave_message=? where id=?')
  setLeaveMessage(message: String, stmt: Statement) {
    this.leaveMessage = message;
    stmt.run(message, this.id);
  }

  @Conduit.update('update guild set music_channel=? where id=?')
  setMusicChannel(channel: Discord.TextChannel, stmt: Statement) {
    this.musicChannel = channel.id;
    stmt.run(channel.id, this.id);
  }

  @Conduit.update('update guild set default_role=? where id=?')
  setDefaultRole(role: Discord.Role, stmt: Statement) {
    this.defaultRole = role.id;
    stmt.run(role.id, this.id);
  }

  @Conduit.update('update guild set audit_channel=? where id=?')
  setAuditChannel(channel: Discord.TextChannel, stmt: Statement) {
    this.auditChannel = channel.id;
    stmt.run(channel.id, this.id);
  }

  @Conduit.access('select command, minutes from rate_limits where guild_id=?')
  loadRateLimits (stmt: Statement) {
    const rows : Array = stmt.all(this.id);
    this.rateLimits = new Discord.Collection();
    rows.map(data => {
      this.rateLimits.set(data.command, new RateLimit(this.id, data.command, data.minutes));
    });
  }

  @Conduit.update('insert into rate_limits values (?, ?, ?)')
  addRateLimit (command: String, minutes: Number, stmt: Statement) {
    if (this.rateLimits.has(command)) {
      throw new ExistenceError(`Command '${command}' already has a rate limit`)
    }
    this.rateLimits.set(command, new RateLimit(this.id, command, minutes));
    stmt.run(this.id, command, minutes);
  }

  @Conduit.update('delete from rate_limits where guild_id=? and command=?')
  removeRateLimit (command: String, stmt: Statement) {
    if (this.rateLimits.has(command)) {
      throw new ExistenceError(`Command '${command}' already has a rate limit`)
    }
    this.rateLimits.delete(command);
    stmt.run(this.id, command);
  }

  hasModeRole (role: Discord.Snowflake) {
    return this.modRoles.includes(role);
  }

  isBlocked (command: String) {
    return this.blockedCommands.includes(command);
  }

  async matchBirthdays (timestamp: moment.Moment) {
    return await this.birthdays.getMatches(timestamp);
  }
}