import {Subject} from '@casl/ability';
import {Application} from '@loopback/core';
import {del, post} from '@loopback/rest';
import {Client} from '@loopback/testlab';

import {Actions} from '../../actions';
import {authorise, usePermissions} from '../../decorators';
import {Permissions} from '../../permissions';
import {AuthUser} from '../../types';
import {Todo} from '../fixtures/components/todo';
import {Roles} from '../fixtures/roles';
import {givenUserWithRole, setupApplication} from '../test-helper';

describe('Permissions', () => {
  let app: Application;
  let client: Client;
  let currentUser: AuthUser | undefined = undefined;

  describe('using @usePermissions', () => {
    const permissions: Permissions<Roles, [Actions, Subject]> = {
      everyone({can}) {
        can(Actions.read, 'Article');
      },
      customer({user, can}) {
        can(Actions.create, 'Article');
        can(Actions.update, 'Article', {userId: user.id});
      },
      operator({can, cannot}) {
        can(Actions.manage, 'Article');
        cannot(Actions.delete, 'Article');
      },
    };

    @usePermissions(permissions)
    class ArticleController {
      constructor() {}

      @post('/articles')
      @authorise('create', 'Article')
      async create() {
        return new Todo({title: 'Todo title', userId: 'tom'});
      }

      @del('/articles/{id}')
      @authorise('delete', 'Article')
      async delete() {
        return true;
      }
    }

    beforeEach(async () => {
      currentUser = undefined;
      ({app, client} = await setupApplication({
        acl: {
          userResolver: async ctx => currentUser,
        },
      }));
      app.controller(ArticleController);
    });

    afterEach(async () => {
      await app.stop();
    });

    it('should return 200 if user has permission', async () => {
      currentUser = givenUserWithRole(Roles.customer);
      await client.post('/articles').expect(200);
    });

    it('should return 403 if user does not have permission', async () => {
      currentUser = givenUserWithRole(Roles.customer);
      await client.del('/articles/id').expect(403);
    });
  });

  describe('using permissions extensions', () => {
    class TodoController {
      constructor() {}

      @post('/todos')
      @authorise('create', Todo)
      async create() {
        return new Todo({title: 'Todo title', userId: 'tom'});
      }

      @del('/todos/{id}')
      @authorise('delete', Todo)
      async delete() {
        return true;
      }
    }

    beforeEach(async () => {
      currentUser = undefined;
      ({app, client} = await setupApplication({
        acl: {
          userResolver: async ctx => currentUser,
        },
      }));
      app.controller(TodoController);
    });

    afterEach(async () => {
      await app.stop();
    });

    it('should return 200 if user has permission', async () => {
      currentUser = givenUserWithRole(Roles.customer);
      await client.post('/todos').expect(200);
    });

    it('should return 403 if user does not have permission', async () => {
      currentUser = givenUserWithRole(Roles.customer);
      await client.del('/todos/id').expect(403);
    });
  });
});
