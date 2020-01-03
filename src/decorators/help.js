import HelpDescriptor from '../util/help'

export default function help (options) {
  return function (target, key, descriptor) {
    if (target.commandHelp === undefined) target.commandHelp = {};

    target.commandHelp[key] = new HelpDescriptor(options.tagline, options.usage, options.description, options.examples);
  }
}