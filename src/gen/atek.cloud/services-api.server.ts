
/**
 * File generated by Atek tsgen
 * env=host
 * DO NOT MODIFY
 */
import { URL } from 'url';
import { ApiBrokerServer, ApiBrokerServerHandlers } from '@atek-cloud/api-broker';

export const ID = "atek.cloud/services-api";
export const REVISION = undefined;
const SCHEMAS = {"$schema":"http://json-schema.org/draft-07/schema#","definitions":{"ServicesApi":{"type":"object"},"LogSubscription":{"type":"object"},"ServiceInfo":{"type":"object","properties":{"status":{"$ref":"#/definitions/StatusEnum"},"settings":{"$ref":"#/definitions/ServiceRecord"}},"required":["status","settings"]},"StatusEnum":{"type":"string","enum":["inactive","active"]},"ServiceRecord":{"type":"object","properties":{"id":{"type":"string"},"port":{"type":"number"},"sourceUrl":{"type":"object","properties":{"hash":{"type":"string"},"host":{"type":"string"},"hostname":{"type":"string"},"href":{"type":"string"},"origin":{"type":"string"},"password":{"type":"string"},"pathname":{"type":"string"},"port":{"type":"string"},"protocol":{"type":"string"},"search":{"type":"string"},"searchParams":{"type":"object"},"username":{"type":"string"}},"required":["hash","host","hostname","href","origin","password","pathname","port","protocol","search","searchParams","username"]},"desiredVersion":{"type":"string"},"package":{"type":"object","properties":{"sourceType":{"$ref":"#/definitions/SourceTypeEnum"},"installedVersion":{"type":"string"},"title":{"type":"string"}},"required":["sourceType"]},"manifest":{"type":"object","properties":{"name":{"type":"string"},"description":{"type":"string"},"author":{"type":"string"},"license":{"type":"string"}}},"system":{"type":"object","properties":{"appPort":{"type":"number"}},"required":["appPort"]},"installedBy":{"type":"string"}},"required":["id","port","sourceUrl","package","system","installedBy"]},"SourceTypeEnum":{"type":"string","enum":["file","git"]},"InstallOpts":{"type":"object","properties":{"sourceUrl":{"type":"object","properties":{"hash":{"type":"string"},"host":{"type":"string"},"hostname":{"type":"string"},"href":{"type":"string"},"origin":{"type":"string"},"password":{"type":"string"},"pathname":{"type":"string"},"port":{"type":"string"},"protocol":{"type":"string"},"search":{"type":"string"},"searchParams":{"type":"object"},"username":{"type":"string"}},"required":["hash","host","hostname","href","origin","password","pathname","port","protocol","search","searchParams","username"]},"desiredVersion":{"type":"string"},"port":{"type":"number"}},"required":["sourceUrl"]},"ConfigureOpts":{"type":"object","properties":{"sourceUrl":{"type":"object","properties":{"hash":{"type":"string"},"host":{"type":"string"},"hostname":{"type":"string"},"href":{"type":"string"},"origin":{"type":"string"},"password":{"type":"string"},"pathname":{"type":"string"},"port":{"type":"string"},"protocol":{"type":"string"},"search":{"type":"string"},"searchParams":{"type":"object"},"username":{"type":"string"}},"required":["hash","host","hostname","href","origin","password","pathname","port","protocol","search","searchParams","username"]},"desiredVersion":{"type":"string"},"port":{"type":"number"}}},"api_ServicesApi_List":{"type":"object","properties":{"params":{"type":"array","minItems":0,"maxItems":0},"returns":{"type":"object","properties":{"services":{"type":"array","items":{"$ref":"#/definitions/ServiceInfo"}}},"required":["services"]}},"required":["params","returns"]},"api_ServicesApi_Get":{"type":"object","properties":{"params":{"type":"array","items":{"type":"string"},"minItems":1,"maxItems":1},"returns":{"$ref":"#/definitions/ServiceInfo"}},"required":["params","returns"]},"api_ServicesApi_Install":{"type":"object","properties":{"params":{"type":"array","items":{"$ref":"#/definitions/InstallOpts"},"minItems":1,"maxItems":1},"returns":{"$ref":"#/definitions/ServiceInfo"}},"required":["params","returns"]},"api_ServicesApi_Uninstall":{"type":"object","properties":{"params":{"type":"array","items":{"type":"string"},"minItems":1,"maxItems":1},"returns":{"type":"null"}},"required":["params","returns"]},"api_ServicesApi_Configure":{"type":"object","properties":{"params":{"type":"array","minItems":2,"items":[{"type":"string"},{"$ref":"#/definitions/ConfigureOpts"}],"maxItems":2},"returns":{"type":"null"}},"required":["params","returns"]},"api_ServicesApi_Start":{"type":"object","properties":{"params":{"type":"array","items":{"type":"string"},"minItems":1,"maxItems":1},"returns":{"type":"null"}},"required":["params","returns"]},"api_ServicesApi_Stop":{"type":"object","properties":{"params":{"type":"array","items":{"type":"string"},"minItems":1,"maxItems":1},"returns":{"type":"null"}},"required":["params","returns"]},"api_ServicesApi_Restart":{"type":"object","properties":{"params":{"type":"array","items":{"type":"string"},"minItems":1,"maxItems":1},"returns":{"type":"null"}},"required":["params","returns"]},"api_ServicesApi_CheckForPackageUpdates":{"type":"object","properties":{"params":{"type":"array","items":{"type":"string"},"minItems":1,"maxItems":1},"returns":{"type":"object","properties":{"hasUpdate":{"type":"boolean"},"installedVersion":{"type":"string"},"latestVersion":{"type":"string"}},"required":["hasUpdate","installedVersion","latestVersion"]}},"required":["params","returns"]},"api_ServicesApi_UpdatePackage":{"type":"object","properties":{"params":{"type":"array","items":{"type":"string"},"minItems":1,"maxItems":1},"returns":{"type":"object","properties":{"installedVersion":{"type":"string"},"oldVersion":{"type":"string"}},"required":["installedVersion","oldVersion"]}},"required":["params","returns"]},"api_ServicesApi_Subscribe":{"type":"object","properties":{"params":{"type":"array","items":{"type":"string"},"minItems":1,"maxItems":1},"returns":{"$ref":"#/definitions/LogSubscription"}},"required":["params","returns"]},"evt_LogSubscription_Data":{"type":"object","properties":{"text":{"type":"string"}},"required":["text"]}}};
const EXPORT_MAP = {"methods":{"list":"#/definitions/api_ServicesApi_List","get":"#/definitions/api_ServicesApi_Get","install":"#/definitions/api_ServicesApi_Install","uninstall":"#/definitions/api_ServicesApi_Uninstall","configure":"#/definitions/api_ServicesApi_Configure","start":"#/definitions/api_ServicesApi_Start","stop":"#/definitions/api_ServicesApi_Stop","restart":"#/definitions/api_ServicesApi_Restart","checkForPackageUpdates":"#/definitions/api_ServicesApi_CheckForPackageUpdates","updatePackage":"#/definitions/api_ServicesApi_UpdatePackage","subscribe":"#/definitions/api_ServicesApi_Subscribe"},"events":{"LogSubscription":{"data":"#/definitions/evt_LogSubscription_Data"}}};

export default class ServicesApiServer extends ApiBrokerServer {
  constructor(handlers: ApiBrokerServerHandlers) {
    super(SCHEMAS, EXPORT_MAP, handlers)
  }
}