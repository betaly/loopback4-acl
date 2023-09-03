/* eslint-disable @typescript-eslint/no-explicit-any */

import {MetadataInspector} from '@loopback/context';
import {ApplicationConfig} from '@loopback/core';
import {OAI3Keys} from '@loopback/openapi-v3/dist/keys';
import {RestEndpoint} from '@loopback/rest';
import {Client, createRestAppClient, givenHttpServerConfig, supertest} from '@loopback/testlab';

import {AclConfig, AnyClass} from '../types';
import {TestAuthorizationApplication} from './fixtures/application';
import {Roles} from './fixtures/roles';

export interface AppWithClient {
  app: TestAuthorizationApplication;
  client: Client;
}

export async function setupApplication(config?: ApplicationConfig & {acl?: AclConfig}): Promise<AppWithClient> {
  const restConfig = givenHttpServerConfig({
    // Customize the server configuration here.
    // Empty values (undefined, '') will be ignored by the helper.
    //
    // host: process.env.HOST,
    // port: +process.env.PORT,
  });
  const app = new TestAuthorizationApplication({
    rest: restConfig,
    ...config,
  });

  // Start Application
  await app.main();

  const client = createRestAppClient(app);
  return {app, client};
}

export function givenUserWithRole(role: Roles, id = 'tom') {
  return {
    id,
    roles: [role],
  };
}

export function buildRequest(client: Client, method: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'del', url: string) {
  return (params?: Record<string, any>) => {
    url = url.replace(/{([^}]*)}/g, (_, key) => {
      const v = params?.[key];
      if (!v) {
        throw new Error(`Missing parameter "${key}"`);
      }
      return v;
    });
    return client[method](url);
  };
}

type RequestHook = (req: supertest.Test) => supertest.Test;

export function buildRequestsFromController<T>(
  client: Client,
  controllerClass: AnyClass<T>,
  hooks?: Partial<Record<keyof T, RequestHook>>,
) {
  const methods = Object.getOwnPropertyNames(controllerClass.prototype).filter(name => {
    return typeof controllerClass.prototype[name] === 'function' && name !== 'constructor';
  });

  const queries: Record<keyof T, ReturnType<typeof buildRequest>> = {} as any;
  for (const method of methods) {
    const endpoint = MetadataInspector.getMethodMetadata<RestEndpoint>(
      OAI3Keys.METHODS_KEY,
      controllerClass.prototype,
      method,
    );
    if (endpoint) {
      const hook = hooks?.[method as keyof T] ?? (req => req);
      const request = buildRequest(client, endpoint.verb as any, endpoint.path);
      queries[method as keyof T] = (params?: Record<string, string>) => hook(request(params));
    }
  }
  return queries;
}
