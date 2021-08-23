
/**
 * File generated by Atek tsgen
 * env=host
 * DO NOT MODIFY
 */
import { URL } from 'url';
import { AtekDbRecordClient, AtekDbApiClient } from '@atek-cloud/api-broker';

export const ID = "atek.cloud/account-session";
export const REVISION = undefined;
export const JSON_SCHEMA = {"$schema":"http://json-schema.org/draft-07/schema#","$ref":"#/definitions/AccountSession","definitions":{"AccountSession":{"type":"object","properties":{"sessionId":{"type":"string"},"accountId":{"type":"string"},"createdAt":{"type":"string","format":"date-time"}},"required":["sessionId","accountId","createdAt"]}}};
export const TEMPLATES = {"table":{"title":"Accounts Sessions","description":"Internal records of sessions with user accounts."},"record":{"key":"{{/sessionId}}","title":"Session for {{/username}} created at {{/createdAt}}"}};

export default interface AccountSession {
  sessionId: string;
  accountId: string;
  createdAt: string;
}

export class AccountSessionTable extends AtekDbRecordClient<AccountSession> {
  constructor(api: AtekDbApiClient, dbId?: string) {
    super(api, dbId, ID, REVISION, TEMPLATES, JSON_SCHEMA)
  }
}
