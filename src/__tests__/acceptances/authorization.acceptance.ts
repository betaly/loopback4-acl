import {Client, toJSON} from '@loopback/testlab';

import {CaslAble, SuperuserAble} from '../../ables';
import {AclBindings} from '../../keys';
import {AuthUser} from '../../types';
import {TestAuthorizationApplication} from '../fixtures/application';
import {Todo, TodoController, TodoRepository} from '../fixtures/components/todo';
import {Roles} from '../fixtures/roles';
import {givenTodo} from '../helpers';
import {buildRequestsFromController, givenUserWithRole, setupApplication} from '../test-helper';

const TodoOfTom = {userId: 'tom', title: 'Todo title'};
const TodoRequests = (client: Client) => buildRequestsFromController(client, TodoController);

describe('Authorization', () => {
  let app: TestAuthorizationApplication;
  let client: Client;
  let todoRepo: TodoRepository;
  let persistedTodo: Todo;
  let currentUser: AuthUser | undefined = undefined;

  let requests: ReturnType<typeof TodoRequests>;

  beforeEach(async () => {
    currentUser = undefined;
    ({app, client} = await setupApplication({
      acl: {
        userResolver: async () => currentUser,
      },
    }));
    await givenTodoRepository();
    requests = TodoRequests(client);
  });
  beforeEach(async () => {
    await todoRepo.deleteAll();
  });
  beforeEach(async () => {
    persistedTodo = await givenTodoInstance({userId: 'tom'});
  });

  afterEach(async () => {
    await app.stop();
  });

  describe('crud', () => {
    describe('accessed without authenticated user', () => {
      it(`can not query posts`, () => {
        return requests
          .find()
          .expect(403)
          .expect(res => {
            expect(res.body).toHaveProperty('error.statusCode', 403);
          });
      });

      it(`can not query post`, () => {
        return requests
          .findById({id: 1})
          .expect(403)
          .expect(res => {
            expect(res.body).toHaveProperty('error.statusCode', 403);
          });
      });

      it(`can not create post`, () => {
        return requests
          .create()
          .send(TodoOfTom)
          .expect(403)
          .expect(res => {
            expect(res.body).toHaveProperty('error.statusCode', 403);
          });
      });

      it(`can not update own post`, () => {
        return requests
          .updateById({id: 1})
          .send(TodoOfTom)
          .expect(403)
          .expect(res => {
            expect(res.body).toHaveProperty('error.statusCode', 403);
          });
      });

      it(`can not update other user's post`, async () => {
        currentUser = givenUserWithRole(Roles.customer, 'jerry');
        return requests
          .updateById({id: persistedTodo.id})
          .send({userId: 'jerry', title: 'Todo title'})
          .expect(403)
          .expect(res => {
            expect(res.body).toHaveProperty('error.statusCode', 403);
          });
      });

      it(`can not delete post`, () => {
        return requests
          .deleteById({id: 1})
          .expect(403)
          .expect(res => {
            expect(res.body).toHaveProperty('error.statusCode', 403);
          });
      });
    });

    describe('accessed by superuser', () => {
      beforeEach(async () => {
        currentUser = givenUserWithRole(Roles.admin, 'tom');
        app.bind(AclBindings.SUPERUSER_ROLE).to(Roles.admin);
      });

      afterEach(async () => {
        await app.stop();
      });

      it(`can query post`, () => {
        return requests
          .findById({id: persistedTodo.id})
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual(toJSON(persistedTodo));
          });
      });

      it(`can query posts`, () => {
        return requests
          .find()
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual([persistedTodo]);
          });
      });

      it(`can create post`, () => {
        const data = toJSON(givenTodo({title: 'go to sleep'}));
        return requests
          .create()
          .send(data)
          .expect(200)
          .expect(res => {
            expect(res.body).toMatchObject(data);
          });
      });

      it(`can update own post`, () => {
        const data = toJSON(givenTodo({title: 'wake up'}));
        return requests.updateById({id: persistedTodo.id}).send(data).expect(204);
      });

      it(`can update other user's post`, async () => {
        const jerryTodo = await givenTodoInstance({userId: 'jerry'});

        const data = toJSON(givenTodo({title: 'wake up'}));
        return requests.updateById({id: jerryTodo.id}).send(data).expect(204);
      });

      it(`can delete post`, () => {
        return requests.deleteById({id: persistedTodo.id}).expect(204);
      });
    });

    describe('accessed by admin with no superuser role configured', () => {
      beforeEach(async () => {
        currentUser = givenUserWithRole(Roles.admin);
      });

      it(`can query post`, () => {
        return requests
          .findById({id: persistedTodo.id})
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual(toJSON(persistedTodo));
          });
      });

      it(`can query posts`, () => {
        return requests
          .find()
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual([toJSON(persistedTodo)]);
          });
      });

      it(`can not update post`, () => {
        return requests
          .updateById({id: persistedTodo.id})
          .expect(403)
          .expect(res => {
            expect(res.body).toHaveProperty('error.statusCode', 403);
          });
      });
    });

    describe('accessed by customer', () => {
      beforeEach(async () => {
        currentUser = givenUserWithRole(Roles.customer);
      });

      it(`can query post`, () => {
        return requests
          .findById({id: persistedTodo.id})
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual(toJSON(persistedTodo));
          });
      });

      it(`can query posts`, () => {
        return requests
          .find()
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual([toJSON(persistedTodo)]);
          });
      });

      it(`can create post`, () => {
        return requests
          .create()
          .send(TodoOfTom)
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual({...TodoOfTom, id: res.body.id});
          });
      });

      it(`can update own post`, () => {
        return requests.updateById({id: persistedTodo.id}).expect(204);
      });

      it(`can not update other user's post`, async () => {
        const jerryTodo = await givenTodoInstance({userId: 'jerry'});

        const data = toJSON(givenTodo({title: 'wake up'}));
        return requests
          .updateById({id: jerryTodo.id})
          .send(data)
          .expect(403)
          .expect(res => {
            expect(res.body).toHaveProperty('error.statusCode', 403);
          });
      });

      it(`can not delete post`, () => {
        return requests.deleteById({id: persistedTodo.id}).expect(403);
      });
    });
  });

  describe('@acl.subject', () => {
    describe('accessed by superuser', () => {
      beforeEach(async () => {
        app.bind(AclBindings.SUPERUSER_ROLE).to(Roles.admin);
        currentUser = givenUserWithRole(Roles.admin);
      });
      testInjectSubject();
    });

    describe('accessed by customer', () => {
      beforeEach(async () => {
        currentUser = givenUserWithRole(Roles.customer);
      });
      testInjectSubject();
    });

    function testInjectSubject() {
      it('should inject subject param', async () => {
        const data = toJSON(givenTodo({title: 'wake up'}));
        return requests
          .updateByIdSubjectParam({id: persistedTodo.id})
          .send(data)
          .expect(200)
          .expect(res => {
            expect(res.body).toMatchObject(toJSON(data));
          });
      });

      it('should inject subject param with tuple subject resolver', async () => {
        const data = toJSON(givenTodo({title: 'wake up'}));
        return requests
          .updateByIdSubjectParamTuple({id: persistedTodo.id})
          .send(data)
          .expect(200)
          .expect(res => {
            expect(res.body).toMatchObject(toJSON(data));
          });
      });
    }
  });

  describe('@acl.conditions', () => {
    describe('accessed by superuser', () => {
      beforeEach(async () => {
        app.bind(AclBindings.SUPERUSER_ROLE).to(Roles.admin);
        currentUser = givenUserWithRole(Roles.admin);
      });

      it('conditions param with resolver', async () => {
        const data = toJSON(givenTodo({title: 'wake up'}));
        return requests.updateByIdConditionsParam({id: persistedTodo.id}).send(data).expect(204);
      });

      it('conditions param without resolver', async () => {
        const data = toJSON(givenTodo({title: 'wake up'}));
        return requests.updateByIdConditionsParamNoResolver({id: persistedTodo.id}).send(data).expect(204);
      });
    });

    describe('accessed by customer', () => {
      beforeEach(async () => {
        currentUser = givenUserWithRole(Roles.customer);
      });

      it('conditions param with resolver', async () => {
        const data = toJSON(givenTodo({title: 'wake up'}));
        return requests
          .updateByIdConditionsParam({id: persistedTodo.id})
          .send(data)
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual(['"userId" = $1', ['tom'], []]);
          });
      });

      it('conditions param without resolver', async () => {
        const data = toJSON(givenTodo({title: 'wake up'}));
        return requests
          .updateByIdConditionsParam({id: persistedTodo.id})
          .send(data)
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual(['"userId" = $1', ['tom'], []]);
          });
      });
    });
  });

  describe('@acl.able', () => {
    describe('accessed by superuser', () => {
      beforeEach(async () => {
        app.bind(AclBindings.SUPERUSER_ROLE).to(Roles.admin);
        currentUser = givenUserWithRole(Roles.admin);
      });

      it('able param', async () => {
        const data = toJSON(givenTodo({title: 'wake up'}));
        return requests
          .updateByIdAbleParam({id: persistedTodo.id})
          .send(data)
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual({
              type: SuperuserAble.name,
              result: true,
            });
          });
      });
    });

    describe('accessed by customer', () => {
      beforeEach(async () => {
        currentUser = givenUserWithRole(Roles.customer);
      });

      it('able param', async () => {
        const data = toJSON(givenTodo({title: 'wake up'}));
        return requests
          .updateByIdAbleParam({id: persistedTodo.id})
          .send(data)
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual({
              type: CaslAble.name,
              result: true,
            });
          });
      });
    });
  });

  async function givenTodoRepository() {
    todoRepo = await app.getRepository(TodoRepository);
  }

  async function givenTodoInstance(todo?: Partial<Todo>) {
    return todoRepo.create(givenTodo(todo));
  }
});
