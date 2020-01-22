import Conduit from '../util/conduit'
import Discord from 'discord.js'
import RateLimit from '../util/rate-limit'
import {ExistenceError} from '../util/errors'
import {Statement} from '../typedefs/statement'

type GuildOptions = Object;

export default class GuildData {
  joinChannel;
  joinMessage;
  leaveChannel;
  leaveMessage;
  musicChannel;
  defaultRole;
  auditChannel;
  modRoles;
  blockedCommands;
  rateLimits;

  #created = false;

  constructor (id: String, options: GuildOptions = null) {
    this.id = id;

    if (options) {
      this.joinChannel = options.joinChannel;
      this.joinMessage = options.joinMessage;
      this.leaveChannel = options.leaveChannel;
      this.leaveMessage = options.leaveMessage;
      this.musicChannel = options.musicChannel;
      this.defaultRole = options.defaultRole;
      this.auditChannel = options.auditChannel;
      this.create();
      this.#created = true;
    } else {
      this.loadData();
      this.loadModRoles();
      this.loadBlockedCommands();
      this.#created = true;
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
    if (this.#created) {
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

  @Conduit.access('select role_id from mode_roles where guild_id=?')
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
    if (command in this.blockedCommands) {
      throw new ExistenceError(`Command '${command}' is already blocked`)
    }
    this.blockedCommands.push(command);
    stmt.run(this.id, command);
  }

  @Conduit.update('delete from blocked_commands where guild_id=? and command=?')
  removeBlockedCommand (command: String, stmt: Statement) {
    if (!(command in this.blockedCommands)) {
      throw new ExistenceError(`Command '${command}' is not blocked`)
    }
    this.blockedCommands.remove(command);
    stmt.run(this.id, command);
  }

  @Conduit.update('update guild set join_channel=? where id=?')
  setJoinChannel(channel: Discord.Snowflake, stmt: Statement) {
    this.joinChannel = channel;
    stmt.run(channel, this.id);
  }

  @Conduit.update('update guild set join_message=? where id=?')
  setJoinMessage(message: Discord.Snowflake, stmt: Statement) {
    this.joinMessage = message;
    stmt.run(message, this.id);
  }

  @Conduit.update('update guild set leave_channel=? where id=?')
  setLeaveChannel(channel: Discord.Snowflake, stmt: Statement) {
    this.leaveChannel = channel;
    stmt.run(channel, this.id);
  }

  @Conduit.update('update guild set leave_message=? where id=?')
  setLeaveMessage(message: Discord.Snowflake, stmt: Statement) {
    this.leaveMessage = message;
    stmt.run(message, this.id);
  }

  @Conduit.update('update guild set music_channel=? where id=?')
  setMusicChannel(channel: Discord.Snowflake, stmt: Statement) {
    this.musicChannel = channel;
    stmt.run(channel, this.id);
  }

  @Conduit.update('update guild set default_role=? where id=?')
  setDefaultRole(role: Discord.Snowflake, stmt: Statement) {
    this.defaultRole = role;
    stmt.run(role, this.id);
  }

  @Conduit.update('update guild set audit_channel=? where id=?')
  setAuditChannel(channel: Discord.Snowflake, stmt: Statement) {
    this.auditChannel = channel;
    stmt.run(channel, this.id);
  }

  @Conduit.access('select command, minutes from rate_limits where guild_id=?')
  loadRateLimits (stmt: Statement) {
    const rows : Array = stmt.all(this.id);
    this.rateLimits = new Discord.Collection();
    rows.map(data => {
      this.rateLimits[data.command] = new RateLimit(this.id, data.command, data.minutes);
    });
  }

  @Conduit.update('insert into rate_limits values (?, ?, ?)')
  addRateLimit (command: String, minutes: Number, stmt: Statement) {
    if (this.rateLimits.has(command)) {
      throw new ExistenceError(`Command '${command}' already has a rate limit`)
    }
    this.rateLimits[command] = new RateLimit(this.id, command, minutes);
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
    return role in this.modRoles;
  }

  isBlocked (command: String) {
    return command in this.blockedCommands;
  }
}