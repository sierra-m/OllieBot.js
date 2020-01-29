import Discord from 'discord.js'

export default class RateLimit {
  #timer;

  constructor (guild_id: Discord.Snowflake, command: String, minutes: Number) {
    this.guild_id = guild_id;
    this.command = command;
    this.minutes = minutes;
    this.#timer = 0;
  }

  reset () {
    this.#timer = Math.floor(this.minutes * 60);
  }

  count (seconds: Number) {
    this.#timer = this.timer > 0 ? this.timer - seconds : 0;
  }

  isClear () {
    return this.#timer === 0;
  }
}