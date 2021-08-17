
/**
 * File generated by Atek tsgen
 * DO NOT MODIFY
 */
import { URL } from 'url';
import { ApiBrokerClient } from '@atek-cloud/api-broker';

const SCHEMAS = {"$schema":"http://json-schema.org/draft-07/schema#","definitions":{"PingApi":{"type":"object"},"api_PingApi_Ping":{"type":"object","properties":{"params":{"type":"array","items":{"type":"number"},"minItems":1,"maxItems":1},"returns":{"type":"number"}},"required":["params","returns"]}}};
const EXPORT_MAP = {"methods":{"ping":"#/definitions/api_PingApi_Ping"},"events":{}};

export class PingApiClient extends ApiBrokerClient {
  constructor() {
    super("atek.cloud/ping-api", SCHEMAS, EXPORT_MAP)
  }

  ping(param: number): Promise<number> {
    return this._rpc("ping", [param])
  }
}
