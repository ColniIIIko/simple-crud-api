import http from 'node:http';
import EventEmitter from 'node:events';
import { AddressInfo } from 'node:net';

import { Handler, HttpMethods, Request, Response } from './types';
import { jsonParser } from './middlewares/parseJson';
import { urlParser } from './middlewares/parseUrl';
import { Router } from './Router';
import { dynamicUrlRegex, dynamicUrlRegexTest } from './util/dynamicUrl';

export class Application {
  private emitter: EventEmitter;
  private server: http.Server;
  private middlewares: Handler[];
  private dynamicRoutes: string[];

  constructor() {
    this.emitter = new EventEmitter();
    this.middlewares = [];
    this.dynamicRoutes = [];
    this.initialiseMiddlewares();
    this.server = this.createServer();
  }

  private initialiseMiddlewares() {
    this.use(jsonParser);
    //this.use(bodyParser);
  }

  public use(middleware: Handler) {
    this.middlewares.push(middleware);
  }

  public add(router: Router) {
    Object.keys(router.endpoints).forEach((path) => {
      const endpoint = router.endpoints[path];
      Object.keys(router.endpoints[path]).forEach((method) => {
        if (path.match(dynamicUrlRegex)) {
          path = path.replace(dynamicUrlRegex.exec(path)?.groups?.dynamic!, 'dynamic');
          this.dynamicRoutes.push(path);
        }
        this.emitter.on(this.getRouteMask(path, method), (req: Request, res: Response) => {
          const handler = endpoint[method as HttpMethods];
          this.middlewares.forEach((middleware) => middleware(req, res));
          handler && handler(req, res);
        });
      });
    });
  }

  public listen(port?: number, cb?: () => void) {
    this.server.listen(port, () => {
      const address = this.server.address() as AddressInfo;
      this.use(
        urlParser(
          address.address !== '::'
            ? `${address.address}:${address.port}`
            : `http://localhost:${port}`
        )
      );
      cb && cb();
    });
  }

  private createServer() {
    const server = http.createServer();
    server.on('request', (req, res) => {
      let body: string = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.dynamic = [];
      req.on('end', () => {
        if (body) {
          req.body = JSON.parse(body);
        }
        this.middlewares.forEach((middleware) => middleware(req, res));
        const emitted = this.emitter.emit(this.getRouteMask(req.pathname, req.method), req, res);

        if (!emitted) {
          const handled = this.handleDynamicRoute(req, res);
          if (!handled) {
            res.statusCode = 404;
            res.send(`path ${req.pathname} doesn't exist`);
          }
        }
      });
    });
    server.on('error', (e) => {
      console.log(e);
    });
    return server;
  }

  private handleDynamicRoute(req: Request, res: Response) {
    const paths = req.pathname.split('/');
    const route = this.dynamicRoutes.find((r) => r.split('/').length === paths.length);
    if (route) {
      const routePaths = route.split('/');
      routePaths.forEach((p, index) => {
        if (p === ':dynamic') req.dynamic.push(paths[index]);
      });
      const emittedDynamic = this.emitter.emit(this.getRouteMask(route, req.method), req, res);

      return emittedDynamic;
    }

    return false;
  }

  private getRouteMask(path: string, method?: string) {
    return `[${path}]:[${method}]`;
  }
}
