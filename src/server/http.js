import { NextResponse } from 'next/server';
import { HttpError, isHttpError } from './errors';

// JSON response for a route handler.
export function json(body, status = 200, headers = {}) {
  return NextResponse.json(body, { status, headers });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

// Parses the JSON body of a request. Throws 400 if the body is not valid JSON.
export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, 'INVALID_JSON', 'Request body must be valid JSON');
  }
}

// Turns an error thrown inside a route handler into the JSON error response.
export function errorResponse(err) {
  if (isHttpError(err)) {
    return json({ error: { code: err.code, message: err.message, ...err.extra } }, err.status);
  }
  console.error(err);
  return json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }, 500);
}
