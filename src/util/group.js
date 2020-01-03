export default class CommandGroup {
  constructor () {}

  /**
   * Check is group has command registered
   * @param name
   * @returns {boolean}
   */
  hasCommand (name) {
    return (this.__proto__.commands.includes(name));
  }

  /**
   * Get registered commands as array
   * @returns {Array}
   */
  getCommands () {
    return this.__proto__.commands;
  }

  /**
   * Execute a command. Does not check if requested command
   * exists, this must be done with `hasCommand`
   * @param command
   * @param bot
   * @param message
   * @param args
   * @returns {Promise<void>}
   */
  async execute (command, bot, message, args) {
    try {
      await this[command](bot, message, args);
    } catch (error) {
      await console.error(error);
    }
  }
}