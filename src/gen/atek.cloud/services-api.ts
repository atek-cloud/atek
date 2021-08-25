
/**
 * File generated by Atek tsgen
 * env=host
 * DO NOT MODIFY
 */
import { URL } from 'url';
import { ApiBrokerClient } from '@atek-cloud/api-broker';

export const ID = "atek.cloud/services-api";
export const REVISION = undefined;

export default class ServicesApiClient extends ApiBrokerClient {
  constructor() {
    super("atek.cloud/services-api")
  }

  list(): Promise<{ services: ServiceInfo[]; }> {
    return this.$rpc("list", [])
  }

  get(id: string): Promise<ServiceInfo> {
    return this.$rpc("get", [id])
  }

  install(opts: InstallOpts): Promise<ServiceInfo> {
    return this.$rpc("install", [opts])
  }

  uninstall(id: string): Promise<void> {
    return this.$rpc("uninstall", [id])
  }

  configure(id: string, opts: ConfigureOpts): Promise<void> {
    return this.$rpc("configure", [id, opts])
  }

  start(id: string): Promise<void> {
    return this.$rpc("start", [id])
  }

  stop(id: string): Promise<void> {
    return this.$rpc("stop", [id])
  }

  restart(id: string): Promise<void> {
    return this.$rpc("restart", [id])
  }

  checkForPackageUpdates(id: string): Promise<{ hasUpdate: boolean; installedVersion: string; latestVersion: string; }> {
    return this.$rpc("checkForPackageUpdates", [id])
  }

  updatePackage(id: string): Promise<{ installedVersion: string; oldVersion: string; }> {
    return this.$rpc("updatePackage", [id])
  }

  subscribe(id: string): LogSubscription {
    return this.$subscribe([id])
  }
}

export interface LogSubscription {
  on(name: "data", handler: (evt: { text: string; }) => void): void;
}

export interface ServiceInfo {
  status: StatusEnum;
  settings: ServiceRecord;
}

export enum StatusEnum {
  inactive = 'inactive',
  active = 'active'
}

export interface InstallOpts {
  sourceUrl: string;
  id?: string;
  desiredVersion?: string;
  port?: number;
}

export interface ConfigureOpts {
  id?: string;
  sourceUrl?: string;
  desiredVersion?: string;
  port?: number;
}

export interface ServiceRecord {
  id: string;
  port: number;
  sourceUrl: string;
  desiredVersion?: string;
  package: {
      sourceType: SourceTypeEnum
      installedVersion?: string
      title?: string
    };
  manifest?: {
      name?: string
      description?: string
      author?: string
      license?: string
    };
  installedBy: string;
}

export enum SourceTypeEnum {
  file = 'file',
  git = 'git'
}
