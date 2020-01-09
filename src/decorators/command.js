export default function command(target, key, descriptor) {
  // set up commands in prototype if not there
  if (target.commands === undefined) target.commands = [];
  if (target.aliases === undefined) target.aliases = {};
  // register this function as a command
  target.commands.push(key);
}