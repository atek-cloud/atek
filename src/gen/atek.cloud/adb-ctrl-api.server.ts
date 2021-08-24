
/**
 * File generated by Atek tsgen
 * env=host
 * DO NOT MODIFY
 */
import { URL } from 'url';
import { ApiBrokerServer, ApiBrokerServerHandlers } from '@atek-cloud/api-broker';

export const ID = "atek.cloud/adb-ctrl-api";
export const REVISION = undefined;
export const SCHEMAS = {"$schema":"http://json-schema.org/draft-07/schema#","definitions":{"AdbCtrlApi":{"type":"object"},"AdbProcessConfig":{"type":"object","properties":{"serverDbId":{"type":"string"}},"required":["serverDbId"]},"DbInfo":{"type":"object","properties":{"dbId":{"type":"string"}},"required":["dbId"]},"DbSettings":{"type":"object","properties":{"type":{"$ref":"#/definitions/DbInternalType"},"alias":{"type":"string"},"displayName":{"type":"string"},"tables":{"type":"array","items":{"type":"string"}},"network":{"$ref":"#/definitions/NetworkSettings"},"persist":{"type":"boolean"},"presync":{"type":"boolean"}}},"DbInternalType":{"type":"string","const":"hyperbee"},"NetworkSettings":{"type":"object","properties":{"access":{"type":"string"}}},"api_AdbCtrlApi_Init":{"type":"object","properties":{"params":{"type":"array","items":{"$ref":"#/definitions/AdbProcessConfig"},"minItems":1,"maxItems":1},"returns":{"type":"null"}},"required":["params","returns"]},"api_AdbCtrlApi_GetConfig":{"type":"object","properties":{"params":{"type":"array","minItems":0,"maxItems":0},"returns":{"$ref":"#/definitions/AdbProcessConfig"}},"required":["params","returns"]},"api_AdbCtrlApi_CreateDb":{"type":"object","properties":{"params":{"type":"array","items":{"$ref":"#/definitions/DbSettings"},"minItems":1,"maxItems":1},"returns":{"$ref":"#/definitions/DbInfo"}},"required":["params","returns"]},"api_AdbCtrlApi_GetOrCreateDb":{"type":"object","properties":{"params":{"type":"array","minItems":2,"items":[{"type":"string"},{"$ref":"#/definitions/DbSettings"}],"maxItems":2},"returns":{"$ref":"#/definitions/DbInfo"}},"required":["params","returns"]},"api_AdbCtrlApi_ConfigureDb":{"type":"object","properties":{"params":{"type":"array","minItems":2,"items":[{"type":"string"},{"$ref":"#/definitions/DbSettings"}],"maxItems":2},"returns":{"type":"null"}},"required":["params","returns"]},"api_AdbCtrlApi_GetDbConfig":{"type":"object","properties":{"params":{"type":"array","items":{"type":"string"},"minItems":1,"maxItems":1},"returns":{"$ref":"#/definitions/DbSettings"}},"required":["params","returns"]},"api_AdbCtrlApi_ListDbs":{"type":"object","properties":{"params":{"type":"array","minItems":0,"maxItems":0},"returns":{"type":"array","items":{"$ref":"#/definitions/DbSettings"}}},"required":["params","returns"]}}};
export const EXPORT_MAP = {"methods":{"init":"#/definitions/api_AdbCtrlApi_Init","getConfig":"#/definitions/api_AdbCtrlApi_GetConfig","createDb":"#/definitions/api_AdbCtrlApi_CreateDb","getOrCreateDb":"#/definitions/api_AdbCtrlApi_GetOrCreateDb","configureDb":"#/definitions/api_AdbCtrlApi_ConfigureDb","getDbConfig":"#/definitions/api_AdbCtrlApi_GetDbConfig","listDbs":"#/definitions/api_AdbCtrlApi_ListDbs"},"events":{}};

export default class AdbCtrlApiServer extends ApiBrokerServer {
  ID = "atek.cloud/adb-ctrl-api";
  REVISION = undefined;

  constructor(handlers: ApiBrokerServerHandlers) {
    super(SCHEMAS, EXPORT_MAP, handlers)
  }
}
