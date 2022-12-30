import { Endpoint, Handler, HttpMethods } from './types';
import { dynamicUrlRegex } from './util/dynamicUrl';

export class Router {
  endpoints: Endpoint;
  constructor() {
    this.endpoints = {};
  }

  private request(method: HttpMethods = 'GET', path: string, handler: Handler) {
    if (path.match(dynamicUrlRegex)) {
      path = path.replace(dynamicUrlRegex.exec(path)?.groups?.dynamic!, ':dynamic');
    }

    if (!this.endpoints[path]) {
      this.endpoints[path] = {};
    }

    const endpoint = this.endpoints[path];

    if (endpoint[method]) {
      throw new Error(`method ${method} at ${path} is already exists`);
    }

    endpoint[method] = handler;
  }

  public get(path: string, handler: Handler) {
    this.request('GET', path, handler);
  }

  public put(path: string, handler: Handler) {
    this.request('PUT', path, handler);
  }

  public post(path: string, handler: Handler) {
    this.request('POST', path, handler);
  }

  public delete(path: string, handler: Handler) {
    this.request('DELETE', path, handler);
  }
}
