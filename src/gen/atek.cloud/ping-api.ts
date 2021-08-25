
/**
 * File generated by Atek tsgen
 * env=host
 * DO NOT MODIFY
 */
import { URL } from 'url';
import { ApiBrokerClient } from '@atek-cloud/api-broker';

export const ID = "atek.cloud/ping-api";
export const REVISION = undefined;

export default class PingApiClient extends ApiBrokerClient {
  constructor() {
    super("atek.cloud/ping-api")
  }

  ping(param: number): Promise<number> {
    return this.$rpc("ping", [param])
  }
}
