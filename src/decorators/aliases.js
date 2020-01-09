export default function aliases (names) {
  return function wrapper (target, key, descriptor) {
    if (target.aliases === undefined) target.aliases = {};
    for (let alias of names) {
      // set each alias to point to original `key` string
      target.aliases[alias] = key;
    }
  }
}