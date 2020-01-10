/*
* The MIT License (MIT)
*
* Copyright (c) 2020 Sierra MacLeod
*
* Permission is hereby granted, free of charge, to any person obtaining a
* copy of this software and associated documentation files (the "Software"),
* to deal in the Software without restriction, including without limitation
* the rights to use, copy, modify, merge, publish, distribute, sublicense,
* and/or sell copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
* OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
* DEALINGS IN THE SOFTWARE.
*/

export default function wrap(wrapperMethod) {
  return (target, key, descriptor) => {

    if ( typeof(target) === 'function' ){
      let newTarget = async function (...arg) {
        var self = this;
        return async function() {
          var methodCallback = async function(){return new target(arg)};
          return await wrapperMethod.call(self, methodCallback, arg, target.name, 'class')
        }()
      };
      return newTarget;
    } else {
      let orgMethod = descriptor.value;
      descriptor.value = async function (...arg) {
        var self = this;
        return async function() {
          var methodCallback = async function() { return await orgMethod.apply(self, arg) };
          return await wrapperMethod.call(self, methodCallback, arg, key, 'function')
        }()
      };
      return descriptor;
    }
  }
}