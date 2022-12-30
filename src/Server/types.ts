import http from 'node:http';

export type Response = http.ServerResponse<http.IncomingMessage> & {
  req: http.IncomingMessage;
};
export type Request = http.IncomingMessage;

export type Handler = (req: Request, res: Response) => void;
export type HttpMethods = 'GET' | 'PUT' | 'POST' | 'DELETE';

export type Endpoint = {
  [path: string]: Partial<Record<HttpMethods, Handler>>;
};
