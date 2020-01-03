export default class HelpDescriptor {
  constructor (tagline, usage, description, examples) {
    if (!Array.isArray(usage)) throw Error('`usage` must be type Array');
    if (!Array.isArray(examples)) throw Error('`examples` must be type Array');
    this.tagline = tagline;
    this.usage = usage;
    this.description = description;
    this.examples = examples;
  }
}