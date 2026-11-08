export class HttpError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
    this.isHttpError = true;
  }
}

// Use this instead of `instanceof HttpError`. `next dev` reloads modules when routes compile, so an error created
// by an object that outlived a reload (anything stored on the context, for example) is not an instance of the
// freshly loaded class.
export function isHttpError(err) {
  return Boolean(err) && err.isHttpError === true;
}
