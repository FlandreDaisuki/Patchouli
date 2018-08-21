// ref: https://stackoverflow.com/questions/31089801/extending-error-in-javascript-with-es6-syntax-babel#32749533
class ExtendableError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(message)).stack;
    }
  }
}

export class InitError extends ExtendableError {}
export class ConnectionError extends ExtendableError {}
