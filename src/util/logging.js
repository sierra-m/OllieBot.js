import { setup, log, deleteLog } from 'node-log-rotate';
import {logSize, appName} from '../config';
import moment from 'moment'

setup({
  appName: appName,  // If you want to specify the project name, you can specify it.
  maxSize: logSize
});

deleteLog(5);

const colorBlue = 34;
const colorWhite = 0;

export default class logging {

  static logBoth (message, priority, color=colorWhite) {
    console.log(`\x1b[37m%s | \x1b[${color}m${priority.padStart(5)}: %s\x1b[0m`, logging.getHeaderSnippet(), message);
    log(message);
  }

  static info (message) {
    logging.logBoth(message, 'INFO');
  }

  static debug (message, levels = 2) {
    logging.logBoth(message + '\n' + logging.getStackSnippet(levels), 'DEBUG', colorBlue);
  }

  static error (message, err = '') {
    const out = logging.getHeaderSnippet('ERROR') + message + '\n' + err.toString();
    console.error(out);
    log(out);
  }

  static getStackSnippet (levels) {
    let stack = new Error().stack;
    return stack.split('\n').slice(3, 3 + levels).join('\n');
  }

  static getHeaderSnippet () {
    return `>> ${moment.utc().format('YYYY-MM-DD hh:mm:ss')}`;
  }
}