
/**
 * File generated by Atek tsgen
 * DO NOT MODIFY
 */
import { ApiBrokerClient } from '@atek-cloud/api-broker';

const SCHEMAS = {"$schema":"http://json-schema.org/draft-07/schema#","definitions":{"SystemApi":{"type":"object"},"Bucket":{"type":"object","properties":{"id":{"type":"string"},"type":{"$ref":"#/definitions/BucketTypeEnum"},"title":{"type":"string"},"items":{"type":"array","items":{"$ref":"#/definitions/BucketChild"}}},"required":["id","type","title","items"]},"BucketTypeEnum":{"type":"string","enum":["bucket:root","bucket:app","bucket:trash","db"]},"BucketChild":{"type":"object","properties":{"id":{"type":"string"},"type":{"$ref":"#/definitions/BucketTypeEnum"},"title":{"type":"string"}},"required":["id","type","title"]},"api_SystemApi_GetBucket":{"type":"object","properties":{"params":{"type":"array","items":{"type":"string"},"minItems":1,"maxItems":1},"returns":{"$ref":"#/definitions/Bucket"}},"required":["params","returns"]}}};
const EXPORT_MAP = {"methods":{"getBucket":"#/definitions/api_SystemApi_GetBucket"},"events":{}};

export class SystemApiClient extends ApiBrokerClient {
  constructor() {
    super(SCHEMAS, EXPORT_MAP)
  }

  getBucket(bucketId: string): Promise<Bucket> {
    return this._rpc("getBucket", [bucketId])
  }
}

export interface Bucket {
  id: string;
  type: BucketTypeEnum;
  title: string;
  items: BucketChild[];
}

export interface BucketChild {
  id: string;
  type: BucketTypeEnum;
  title: string;
}

export enum BucketTypeEnum {
  root = 'bucket:root',
  app = 'bucket:app',
  trash = 'bucket:trash',
  db = 'db'
}
