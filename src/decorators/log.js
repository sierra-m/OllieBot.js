import {wrap} from 'decorator-wrap'

const log = (injection) => (
  async (callback, args, name, type) => {
    callback.isCommand = true;
    console.log(`Starting ${injection}`, type, name);
    args.push('lastly');
    let result = await callback();
    console.log(`Ended:`, name);
    return result;
  }
);

export default function(inj) {
  return function (target, key, descriptor) {
    return wrap(log(inj))(target, key, descriptor);
  }
}