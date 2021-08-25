
/**
 * File generated by Atek tsgen
 * env=host
 * DO NOT MODIFY
 */
import { URL } from 'url';
import { ApiBrokerClient } from '@atek-cloud/api-broker';

export const ID = "atek.cloud/accounts-api";
export const REVISION = undefined;

export default class AccountsApiClient extends ApiBrokerClient {
  constructor() {
    super("atek.cloud/accounts-api")
  }

  create(opts: {username: string, password: string}): Promise<Account> {
    return this.$rpc("create", [opts])
  }

  list(): Promise<Account[]> {
    return this.$rpc("list", [])
  }

  get(id: string): Promise<Account> {
    return this.$rpc("get", [id])
  }

  getByUsername(username: string): Promise<Account> {
    return this.$rpc("getByUsername", [username])
  }

  delete(id: string): Promise<void> {
    return this.$rpc("delete", [id])
  }
}

export interface Account {
  id: string;
  username: string;
}
