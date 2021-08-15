
/**
 * File generated by Atek tsgen
 * DO NOT MODIFY
 */
import { ApiBrokerClient } from '@atek-cloud/api-broker';

const SCHEMAS = {"$schema":"http://json-schema.org/draft-07/schema#","definitions":{"AccountsApi":{"type":"object"},"Account":{"type":"object","properties":{"id":{"type":"string"},"username":{"type":"string"}},"required":["id","username"]},"api_AccountsApi_Create":{"type":"object","properties":{"params":{"type":"array","items":{"type":"object","properties":{"username":{"type":"string"},"password":{"type":"string"}},"required":["username","password"]},"minItems":1,"maxItems":1},"returns":{"$ref":"#/definitions/Account"}},"required":["params","returns"]},"api_AccountsApi_List":{"type":"object","properties":{"params":{"type":"array","minItems":0,"maxItems":0},"returns":{"type":"array","items":{"$ref":"#/definitions/Account"}}},"required":["params","returns"]},"api_AccountsApi_Get":{"type":"object","properties":{"params":{"type":"array","items":{"type":"string"},"minItems":1,"maxItems":1},"returns":{"$ref":"#/definitions/Account"}},"required":["params","returns"]},"api_AccountsApi_GetByUsername":{"type":"object","properties":{"params":{"type":"array","items":{"type":"string"},"minItems":1,"maxItems":1},"returns":{"$ref":"#/definitions/Account"}},"required":["params","returns"]},"api_AccountsApi_Delete":{"type":"object","properties":{"params":{"type":"array","items":{"type":"string"},"minItems":1,"maxItems":1},"returns":{"type":"null"}},"required":["params","returns"]}}};
const EXPORT_MAP = {"methods":{"create":"#/definitions/api_AccountsApi_Create","list":"#/definitions/api_AccountsApi_List","get":"#/definitions/api_AccountsApi_Get","getByUsername":"#/definitions/api_AccountsApi_GetByUsername","delete":"#/definitions/api_AccountsApi_Delete"},"events":{}};

export class AccountsApiClient extends ApiBrokerClient {
  constructor() {
    super(SCHEMAS, EXPORT_MAP)
  }

  create(opts: {username: string, password: string}): Promise<Account> {
    return this._rpc("create", [opts])
  }

  list(): Promise<Account[]> {
    return this._rpc("list", [])
  }

  get(id: string): Promise<Account> {
    return this._rpc("get", [id])
  }

  getByUsername(username: string): Promise<Account> {
    return this._rpc("getByUsername", [username])
  }

  delete(id: string): Promise<void> {
    return this._rpc("delete", [id])
  }
}

export interface Account {
  id: string;
  username: string;
}
