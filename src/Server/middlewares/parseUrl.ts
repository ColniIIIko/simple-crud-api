import { Handler, Request, Response } from '../types';

type Params = {
  [key: string]: string;
};

export const urlParser =
  (baseUrl: string): Handler =>
  (req: Request, res: Response) => {
    const url = new URL(req.url || '', baseUrl);
    const params: Params = {};
    url.searchParams.forEach((value, key) => (params[key] = value));
    req.pathname = url.pathname;
    req.params = params;
  };
