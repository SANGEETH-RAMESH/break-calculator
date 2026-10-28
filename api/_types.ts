import type { IncomingMessage, ServerResponse } from 'http';

export type VercelRequest = IncomingMessage & {
  body: any;
  query: Record<string, string | string[]>;
  headers: Record<string, string | string[] | undefined>;
};

export type VercelResponse = ServerResponse & {
  status: (statusCode: number) => VercelResponse;
  json: (body: any) => VercelResponse;
  send: (body: any) => VercelResponse;
};
