import {ApplicationConfig} from '@loopback/core';
import {Client, createRestAppClient, givenHttpServerConfig} from '@loopback/testlab';

import {AclConfig} from '../types';
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
