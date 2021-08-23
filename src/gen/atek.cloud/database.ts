
/**
 * File generated by Atek tsgen
 * env=host
 * DO NOT MODIFY
 */
import { URL } from 'url';
import { AtekDbRecordClient, AtekDbApiClient } from '@atek-cloud/api-broker';

export const ID = "atek.cloud/database";
export const REVISION = undefined;
export const JSON_SCHEMA = {"$schema":"http://json-schema.org/draft-07/schema#","definitions":{"Database":{"type":"object","properties":{"dbId":{"type":"string"},"cachedMeta":{"type":"object","properties":{"displayName":{"type":"string"},"writable":{"type":"boolean"}}},"network":{"type":"object","properties":{"access":{"$ref":"#/definitions/NetworkAccess"}}},"services":{"type":"array","items":{"$ref":"#/definitions/ServiceConfig"}},"createdBy":{"type":"object","properties":{"accountId":{"type":"string"},"serviceId":{"type":"string"}}},"createdAt":{"type":"string","format":"date-time"}},"required":["dbId","createdAt"]},"NetworkAccess":{"type":"string","enum":["private","public"]},"ServiceConfig":{"type":"object","properties":{"serviceId":{"type":"string"},"alias":{"type":"string"},"persist":{"type":"boolean"},"presync":{"type":"boolean"}},"required":["serviceId"]}},"$ref":"#/definitions/Database"};
export const TEMPLATES = {"table":{"title":"Databases","description":"Settings and cached state for databases."},"record":{"key":"{{/dbId}}","title":"Database ID: {{/dbId}}"}};

export default interface Database {
  dbId: string;
  cachedMeta?: {
      displayName?: string
      writable?: boolean
    };
  network?: {
      access?: NetworkAccess
    };
  services?: ServiceConfig[];
  createdBy?: {
      accountId?: string
      serviceId?: string
    };
  createdAt: string;
}

export interface ServiceConfig {
  serviceId: string;
  alias?: string;
  persist?: boolean;
  presync?: boolean;
}

export enum NetworkAccess {
  'private' = 'private',
  'public' = 'public'
}

export class DatabaseTable extends AtekDbRecordClient<Database> {
  constructor(api: AtekDbApiClient, dbId?: string) {
    super(api, dbId, ID, REVISION, TEMPLATES, JSON_SCHEMA)
  }
}
