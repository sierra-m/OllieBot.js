export default class Extraction {
  constructor (args, subpatterns) {
    this.extracted = {};
    this.args = args;
    this.subpatterns = subpatterns;
  }

  register (arg, argRep) {
    this.extracted[arg] = argRep;
  }

  getByIndex (index) {
    return this.extracted[this.args[index]];
  }

  getByArg (arg) {
    const val = this.extracted[arg];
    if (val === undefined) return arg;
    return val;
  }

  get complete () {
    return this.args.length === this.subpatterns.length;
  }
}