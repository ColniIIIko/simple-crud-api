declare module 'http' {
  export interface IncomingMessage {
    body: any;
    pathname: string;
    params: {
      [key: string]: string;
    };
    dynamic: string[];
  }

  export interface ServerResponse<IncomingMessage> {
    send: (data: any) => void;
  }
}
