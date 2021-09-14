import WebSocket from 'ws'
import { Session } from '../httpapi/session-middleware.js'

export enum TransportEnum {
  PROXY = 'proxy',
  RPC = 'rpc'
}

export interface ApiProvider {
  id: string
  handleRpc? (callDesc: CallDescription, methodName: string, params: any[], ctx: CallContext): Promise<any>
  handleProxy? (callDesc: CallDescription, socket: WebSocket, ctx: CallContext): any
}

export interface CallDescription {
  transport: TransportEnum
  service?: string
  api?: string
}

export interface CallContext {
  session?: Session
}

export class CustomError extends Error {
  name: string;
  code: number;
  data: any;

  constructor(code: number, message: string, data?: any) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.data = data;
  }
}

export class ServiceNotFound extends CustomError {
  static CODE = -32601; // we're using JSON-RPC's code for this
  constructor (msg: string, data?: any) {
    super(ServiceNotFound.CODE, msg, data)
  }
}