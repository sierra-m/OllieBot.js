export function register (registerMethod) {
  return (target, key, descriptor) => {
    registerMethod.call(target, key, descriptor)
  }
}