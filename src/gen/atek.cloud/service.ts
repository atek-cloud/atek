
/**
 * File generated by Atek tsgen
 * env=host
 * DO NOT MODIFY
 */
import { URL } from 'url';

export const ID = "atek.cloud/service";
export const REVISION = undefined;
export const JSON_SCHEMA = {"$schema":"http://json-schema.org/draft-07/schema#","definitions":{"Service":{"type":"object","properties":{"id":{"type":"string"},"port":{"type":"number"},"sourceUrl":{"type":"object","properties":{"hash":{"type":"string"},"host":{"type":"string"},"hostname":{"type":"string"},"href":{"type":"string"},"origin":{"type":"string"},"password":{"type":"string"},"pathname":{"type":"string"},"port":{"type":"string"},"protocol":{"type":"string"},"search":{"type":"string"},"searchParams":{"type":"object"},"username":{"type":"string"}},"required":["hash","host","hostname","href","origin","password","pathname","port","protocol","search","searchParams","username"]},"desiredVersion":{"type":"string"},"package":{"type":"object","properties":{"sourceType":{"$ref":"#/definitions/SourceTypeEnum"},"installedVersion":{"type":"string"},"title":{"type":"string"}},"required":["sourceType"]},"manifest":{"$ref":"#/definitions/ServiceManifest"},"system":{"type":"object","properties":{"appPort":{"type":"number"}},"required":["appPort"]},"installedBy":{"type":"string"}},"required":["id","port","sourceUrl","package","system","installedBy"]},"SourceTypeEnum":{"type":"string","enum":["file","git"]},"ServiceManifest":{"type":"object","properties":{"runtime":{"$ref":"#/definitions/RuntimeEnum"},"name":{"type":"string"},"description":{"type":"string"},"author":{"type":"string"},"license":{"type":"string"},"exports":{"type":"array","items":{"$ref":"#/definitions/ApiExportDesc"}}}},"RuntimeEnum":{"type":"string","enum":["deno","node"]},"ApiExportDesc":{"type":"object","properties":{"api":{"type":"string"},"path":{"type":"string"}},"required":["api"]}},"$ref":"#/definitions/Service"};
export const TEMPLATES = {"table":{"title":"Services","description":"Services installed to the host environment."},"record":{"key":"{{/id}}","title":"Service \"{{/id}}\", source: {{/sourceUrl}}"}};

export default interface Service {
  id: string;
  port: number;
  sourceUrl: URL;
  desiredVersion?: string;
  package: {
      sourceType: SourceTypeEnum
      installedVersion?: string
      title?: string
    };
  manifest?: ServiceManifest;
  system: {
      appPort: number
    };
  installedBy: string;
}

export interface ServiceManifest {
  runtime?: RuntimeEnum;
  name?: string;
  description?: string;
  author?: string;
  license?: string;
  exports?: ApiExportDesc[];
}

export interface ApiExportDesc {
  api: string;
  path?: string;
}

export enum RuntimeEnum {
  deno = 'deno',
  node = 'node'
}

export enum SourceTypeEnum {
  file = 'file',
  git = 'git'
}
