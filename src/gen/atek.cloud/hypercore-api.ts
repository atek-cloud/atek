
/**
 * File generated by Atek tsgen
 * env=host
 * DO NOT MODIFY
 */
import { URL } from 'url';
import { ApiBrokerClient } from '@atek-cloud/api-broker';

export const ID = "atek.cloud/hypercore-api";
export const REVISION = undefined;
const SCHEMAS = {"$schema":"http://json-schema.org/draft-07/schema#","definitions":{"HypercoreApi":{"type":"object"},"HypercoreSubscription":{"type":"object"},"GlobalSubscription":{"type":"object"},"CreateResponse":{"type":"object","properties":{"key":{"type":"string","contentEncoding":"base64"},"discoveryKey":{"type":"string","contentEncoding":"base64"},"writable":{"type":"boolean"},"length":{"type":"number"},"byteLength":{"type":"number"}},"required":["key","discoveryKey","writable","length","byteLength"]},"DescribeResponse":{"type":"object","properties":{"key":{"type":"string","contentEncoding":"base64"},"discoveryKey":{"type":"string","contentEncoding":"base64"},"writable":{"type":"boolean"},"length":{"type":"number"},"byteLength":{"type":"number"}},"required":["key","discoveryKey","writable","length","byteLength"]},"GetOptions":{"type":"object","properties":{"ifAvailable":{"type":"boolean"},"wait":{"type":"boolean"},"callId":{"type":"boolean"}},"required":["ifAvailable","wait","callId"]},"DownloadOptions":{"type":"object","properties":{"callId":{"type":"string"}},"required":["callId"]},"UpdateOptions":{"type":"object","properties":{"minLength":{"type":"number"},"ifAvailable":{"type":"boolean"},"hash":{"type":"boolean"}},"required":["minLength","ifAvailable","hash"]},"SeekResponse":{"type":"object","properties":{"index":{"type":"number"},"relativeOffset":{"type":"number"}},"required":["index","relativeOffset"]},"ConfigureNetworkOptions":{"type":"object","properties":{"lookup":{"type":"boolean"},"announce":{"type":"boolean"},"flush":{"type":"boolean"},"remember":{"type":"boolean"}},"required":["lookup","announce","flush","remember"]},"Peer":{"type":"object","properties":{"remotePublicKey":{"type":"string","contentEncoding":"base64"},"remoteAddress":{"type":"string"},"type":{"type":"string"}},"required":["remotePublicKey","remoteAddress","type"]},"api_HypercoreApi_Create":{"type":"object","properties":{"params":{"type":"array","minItems":0,"maxItems":0},"returns":{"$ref":"#/definitions/CreateResponse"}},"required":["params","returns"]},"api_HypercoreApi_Describe":{"type":"object","properties":{"params":{"type":"array","items":{"type":"string","contentEncoding":"base64"},"minItems":1,"maxItems":1},"returns":{"$ref":"#/definitions/DescribeResponse"}},"required":["params","returns"]},"api_HypercoreApi_Append":{"type":"object","properties":{"params":{"type":"array","minItems":2,"items":[{"type":"string","contentEncoding":"base64"},{"anyOf":[{"type":"string","contentEncoding":"base64"},{"type":"array","items":{"type":"string","contentEncoding":"base64"}}]}],"maxItems":2},"returns":{"type":"number"}},"required":["params","returns"]},"api_HypercoreApi_Get":{"type":"object","properties":{"params":{"type":"array","minItems":2,"items":[{"type":"string","contentEncoding":"base64"},{"type":"number"},{"$ref":"#/definitions/GetOptions"}],"maxItems":3},"returns":{"type":"string","contentEncoding":"base64"}},"required":["params","returns"]},"api_HypercoreApi_Cancel":{"type":"object","properties":{"params":{"type":"array","minItems":2,"items":[{"type":"string","contentEncoding":"base64"},{"type":"string"}],"maxItems":2},"returns":{"type":"null"}},"required":["params","returns"]},"api_HypercoreApi_Has":{"type":"object","properties":{"params":{"type":"array","minItems":2,"items":[{"type":"string","contentEncoding":"base64"},{"type":"number"}],"maxItems":2},"returns":{"type":"boolean"}},"required":["params","returns"]},"api_HypercoreApi_Download":{"type":"object","properties":{"params":{"type":"array","minItems":1,"items":[{"type":"string","contentEncoding":"base64"},{"type":"number"},{"type":"number"},{"$ref":"#/definitions/DownloadOptions"}],"maxItems":4},"returns":{"type":"null"}},"required":["params","returns"]},"api_HypercoreApi_Undownload":{"type":"object","properties":{"params":{"type":"array","minItems":2,"items":[{"type":"string","contentEncoding":"base64"},{"type":"string"}],"maxItems":2},"returns":{"type":"null"}},"required":["params","returns"]},"api_HypercoreApi_Downloaded":{"type":"object","properties":{"params":{"type":"array","minItems":1,"items":[{"type":"string","contentEncoding":"base64"},{"type":"number"},{"type":"number"}],"maxItems":3},"returns":{"type":"number"}},"required":["params","returns"]},"api_HypercoreApi_Update":{"type":"object","properties":{"params":{"type":"array","minItems":2,"items":[{"type":"string","contentEncoding":"base64"},{"$ref":"#/definitions/UpdateOptions"}],"maxItems":2},"returns":{"type":"null"}},"required":["params","returns"]},"api_HypercoreApi_Seek":{"type":"object","properties":{"params":{"type":"array","minItems":2,"items":[{"type":"string","contentEncoding":"base64"},{"type":"number"}],"maxItems":2},"returns":{"$ref":"#/definitions/SeekResponse"}},"required":["params","returns"]},"api_HypercoreApi_ConfigureNetwork":{"type":"object","properties":{"params":{"type":"array","minItems":2,"items":[{"type":"string","contentEncoding":"base64"},{"$ref":"#/definitions/ConfigureNetworkOptions"}],"maxItems":2},"returns":{"type":"null"}},"required":["params","returns"]},"api_HypercoreApi_Subscribe":{"type":"object","properties":{"params":{"type":"array","items":{"type":"string","contentEncoding":"base64"},"minItems":0,"maxItems":1},"returns":{"anyOf":[{"$ref":"#/definitions/HypercoreSubscription"},{"$ref":"#/definitions/GlobalSubscription"}]}},"required":["params","returns"]},"evt_HypercoreSubscription_Append":{"type":"object","properties":{"key":{"type":"string","contentEncoding":"base64"},"length":{"type":"number"},"byteLength":{"type":"number"}},"required":["key","length","byteLength"]},"evt_HypercoreSubscription_Close":{"type":"object","properties":{"key":{"type":"string","contentEncoding":"base64"}},"required":["key"]},"evt_HypercoreSubscription_PeerAdd":{"type":"object","properties":{"key":{"type":"string","contentEncoding":"base64"},"id":{"type":"number"},"peer":{"$ref":"#/definitions/Peer"}},"required":["key","id","peer"]},"evt_HypercoreSubscription_PeerRemove":{"type":"object","properties":{"key":{"type":"string","contentEncoding":"base64"},"id":{"type":"number"},"peer":{"$ref":"#/definitions/Peer"}},"required":["key","id","peer"]},"evt_HypercoreSubscription_Wait":{"type":"object","properties":{"key":{"type":"string","contentEncoding":"base64"}},"required":["key"]},"evt_HypercoreSubscription_Download":{"type":"object","properties":{"key":{"type":"string","contentEncoding":"base64"},"seq":{"type":"number"},"byteLength":{"type":"number"}},"required":["key","seq","byteLength"]},"evt_HypercoreSubscription_Upload":{"type":"object","properties":{"key":{"type":"string","contentEncoding":"base64"},"seq":{"type":"number"},"byteLength":{"type":"number"}},"required":["key","seq","byteLength"]},"evt_GlobalSubscription_PeerAdd":{"type":"object","properties":{"id":{"type":"number"},"peer":{"$ref":"#/definitions/Peer"}},"required":["id","peer"]},"evt_GlobalSubscription_PeerRemove":{"type":"object","properties":{"id":{"type":"number"},"peer":{"$ref":"#/definitions/Peer"}},"required":["id","peer"]}}};
const EXPORT_MAP = {"methods":{"create":"#/definitions/api_HypercoreApi_Create","describe":"#/definitions/api_HypercoreApi_Describe","append":"#/definitions/api_HypercoreApi_Append","get":"#/definitions/api_HypercoreApi_Get","cancel":"#/definitions/api_HypercoreApi_Cancel","has":"#/definitions/api_HypercoreApi_Has","download":"#/definitions/api_HypercoreApi_Download","undownload":"#/definitions/api_HypercoreApi_Undownload","downloaded":"#/definitions/api_HypercoreApi_Downloaded","update":"#/definitions/api_HypercoreApi_Update","seek":"#/definitions/api_HypercoreApi_Seek","configureNetwork":"#/definitions/api_HypercoreApi_ConfigureNetwork","subscribe":"#/definitions/api_HypercoreApi_Subscribe"},"events":{"HypercoreSubscription":{"append":"#/definitions/evt_HypercoreSubscription_Append","close":"#/definitions/evt_HypercoreSubscription_Close","peer-add":"#/definitions/evt_HypercoreSubscription_PeerAdd","peer-remove":"#/definitions/evt_HypercoreSubscription_PeerRemove","wait":"#/definitions/evt_HypercoreSubscription_Wait","download":"#/definitions/evt_HypercoreSubscription_Download","upload":"#/definitions/evt_HypercoreSubscription_Upload"},"GlobalSubscription":{"peer-add":"#/definitions/evt_GlobalSubscription_PeerAdd","peer-remove":"#/definitions/evt_GlobalSubscription_PeerRemove"}}};

export default class HypercoreApiClient extends ApiBrokerClient {
  constructor() {
    super("atek.cloud/hypercore-api", SCHEMAS, EXPORT_MAP)
  }

  create(): Promise<CreateResponse> {
    return this._rpc("create", [])
  }

  describe(key: Uint8Array): Promise<DescribeResponse> {
    return this._rpc("describe", [key])
  }

  append(key: Uint8Array, data: Uint8Array|Uint8Array[]): Promise<number> {
    return this._rpc("append", [key, data])
  }

  get(key: Uint8Array, index: number, options?: GetOptions): Promise<Uint8Array> {
    return this._rpc("get", [key, index, options])
  }

  cancel(key: Uint8Array, getcallId: string): Promise<void> {
    return this._rpc("cancel", [key, getcallId])
  }

  has(key: Uint8Array, index: number): Promise<boolean> {
    return this._rpc("has", [key, index])
  }

  download(key: Uint8Array, start?: number, end?: number, options?: DownloadOptions): Promise<void> {
    return this._rpc("download", [key, start, end, options])
  }

  undownload(key: Uint8Array, downloadcallId: string): Promise<void> {
    return this._rpc("undownload", [key, downloadcallId])
  }

  downloaded(key: Uint8Array, start?: number, end?: number): Promise<number> {
    return this._rpc("downloaded", [key, start, end])
  }

  update(key: Uint8Array, options: UpdateOptions): Promise<void> {
    return this._rpc("update", [key, options])
  }

  seek(key: Uint8Array, byteOffset: number): Promise<SeekResponse> {
    return this._rpc("seek", [key, byteOffset])
  }

  configureNetwork(key: Uint8Array, options: ConfigureNetworkOptions): Promise<void> {
    return this._rpc("configureNetwork", [key, options])
  }

  subscribe(key?: Uint8Array): HypercoreSubscription | GlobalSubscription {
    return this._subscribe([key])
  }
}

export interface HypercoreSubscription {
  on(name: "append", handler: (evt: { key: Uint8Array; length: number; byteLength: number; }) => void): void;
  on(name: "close", handler: (evt: { key: Uint8Array; }) => void): void;
  on(name: "peer-add", handler: (evt: { key: Uint8Array; id: number; peer: Peer; }) => void): void;
  on(name: "peer-remove", handler: (evt: { key: Uint8Array; id: number; peer: Peer; }) => void): void;
  on(name: "wait", handler: (evt: { key: Uint8Array; }) => void): void;
  on(name: "download", handler: (evt: { key: Uint8Array; seq: number; byteLength: number; }) => void): void;
  on(name: "upload", handler: (evt: { key: Uint8Array; seq: number; byteLength: number; }) => void): void;
}

export interface GlobalSubscription {
  on(name: "peer-add", handler: (evt: { id: number; peer: Peer; }) => void): void;
  on(name: "peer-remove", handler: (evt: { id: number; peer: Peer; }) => void): void;
}

export interface CreateResponse {
  key: Uint8Array;
  discoveryKey: Uint8Array;
  writable: boolean;
  length: number;
  byteLength: number;
}

export interface DescribeResponse {
  key: Uint8Array;
  discoveryKey: Uint8Array;
  writable: boolean;
  length: number;
  byteLength: number;
}

export interface GetOptions {
  ifAvailable: boolean;
  wait: boolean;
  callId: boolean;
}

export interface DownloadOptions {
  callId: string;
}

export interface UpdateOptions {
  minLength: number;
  ifAvailable: boolean;
  hash: boolean;
}

export interface SeekResponse {
  index: number;
  relativeOffset: number;
}

export interface ConfigureNetworkOptions {
  lookup: boolean;
  announce: boolean;
  flush: boolean;
  remember: boolean;
}

export interface Peer {
  remotePublicKey: Uint8Array;
  remoteAddress: string;
  type: string;
}
