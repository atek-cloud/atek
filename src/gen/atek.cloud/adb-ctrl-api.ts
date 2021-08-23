
/**
 * File generated by Atek tsgen
 * env=host
 * DO NOT MODIFY
 */
import { URL } from 'url';
import { ApiBrokerClient } from '@atek-cloud/api-broker';

export const ID = "atek.cloud/adb-ctrl-api";
export const REVISION = undefined;
const SCHEMAS = {"$schema":"http://json-schema.org/draft-07/schema#","definitions":{"AdbCtrlApi":{"type":"object"},"AdbSettings":{"type":"object","properties":{"serverDbId":{"type":"string"}},"required":["serverDbId"]},"api_AdbCtrlApi_Init":{"type":"object","properties":{"params":{"type":"array","items":{"$ref":"#/definitions/AdbSettings"},"minItems":1,"maxItems":1},"returns":{"type":"null"}},"required":["params","returns"]},"api_AdbCtrlApi_GetConfig":{"type":"object","properties":{"params":{"type":"array","minItems":0,"maxItems":0},"returns":{"$ref":"#/definitions/AdbSettings"}},"required":["params","returns"]}}};
const EXPORT_MAP = {"methods":{"init":"#/definitions/api_AdbCtrlApi_Init","getConfig":"#/definitions/api_AdbCtrlApi_GetConfig"},"events":{}};

export default class AdbCtrlApiClient extends ApiBrokerClient {
  constructor() {
    super("atek.cloud/adb-ctrl-api", SCHEMAS, EXPORT_MAP)
  }

  init(settings: AdbSettings): Promise<void> {
    return this._rpc("init", [settings])
  }

  getConfig(): Promise<AdbSettings> {
    return this._rpc("getConfig", [])
  }
}

export interface AdbSettings {
  serverDbId: string;
}
