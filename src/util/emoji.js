export default class UnicodeEmoji {
  constructor (text) {
    if (text.length > 2) throw Error('Must pass single U32 unicode character.');
    this.text = text;
  }

  // extract unicode char code
  extractCode () {
    return ((((this.text.charCodeAt(0)-0xD800)*0x400) + (this.text.charCodeAt(1)-0xDC00) + 0x10000));
  };

  get url () {
    return `https://abs.twimg.com/emoji/v2/72x72/${this.extractCode().toString(16)}.png`
  }
}