# loopback4-acl

> Access control for Loopback 4. Initial implemented with [CASL](https://casl.js.org/v6/en/)
>
> Inspired by [nest-casl](https://github.com/getjerry/nest-casl)

## Installation

npm

```sh
npm install --save loopback4-acl
```

yarn

```sh
yarn add loopback4-acl
```

## Usage

Define roles for app:

```ts
// roles.ts

export enum Roles {
  admin = 'admin',
  operator = 'operator',
  customer = 'customer',
}
```

Mount casl authorization component:

```ts
import {CaslComponent} from 'loopback4-acl';
import {AuthenticationBindings} from '@bleco/authentication';
import {AclBindings} from './keys';
import {Roles} from './roles';

export class MyApplication extends BootMixin(ServiceMixin(RepositoryMixin(RestApplication))) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Config and mount casl authorization component
    this.bind(AclBindings.CONFIG).to({
      superUserRoles: Roles.admin,
      userResolver: async (ctx: Context) => ctx.get(AuthenticationBindings.CURRENT_USER),
      // or
      // userResolver: AuthenticationBindings.CURRENT_USER,
    });
    this.component(CaslComponent);

    // ...
  }
}
```

`superuserRole` will have unrestricted access. If `userResolver` omitted binding `SecurityBindings.USER` from
[@loopback/security](https://www.npmjs.com/package/@loopback/security) will be used. User expected to have properties
`id: string` and `roles: Roles[]` by default.

## Permissions definition

`loopback4-acl` comes with a set of default actions, aligned with
[Loopback4 Query](https://github.com/betaly/loopback4-query). `manage` has a special meaning of any action.
DefaultActions aliased to `Actions` for convenience.

```ts
// actions.ts

export enum DefaultActions {
  read = 'read',
  create = 'create',
  update = 'update',
  delete = 'delete',
  manage = 'manage',
  execute = 'execute',
}
```

In case you need custom actions either [extend DefaultActions](#custom-actions) or just copy and update, if extending
typescript enum looks too tricky.

Permissions defined per module. `everyone` permissions applied to every user, it has `every` alias for
`every({ user, can })` be more readable. Roles can be extended with previously defined roles.

```ts
// permissions.ts

import {Permissions, Actions} from 'loopback4-acl';
import {InferSubjects} from '@casl/ability';

import {Roles} from './roles';
import {Todo} from './models/post.model';
import {Comment} from './models/comment.model';

export type Subjects = InferSubjects<typeof Todo, typeof Comment>;

export const permissions: Permissions<Roles, Subjects, Actions> = {
  everyone({can}) {
    can(Actions.read, Todo);
    can(Actions.create, Todo);
  },

  customer({user, can}) {
    can(Actions.update, Todo, {userId: user.id});
  },

  operator({can, cannot, extend}) {
    extend(Roles.customer);

    can(Actions.manage, TodoCategory);
    can(Actions.manage, Todo);
    cannot(Actions.delete, Todo);
  },
};
```

Apply permissions to controller with `@usePermissions` decorator. It will ignore global permissions extensions.

```ts
// todo.controller.ts

import {permissions} from './permissions';
import {usePermissions} from './use-permissions';

@usePermissions(permissions)
// @usePermissions([permissions1, permissions2])
export class TodoController {
  // ...
}
```

Register as global permissions to all controllers that without `@usePermission` decorator.

```ts
// component.ts
export class SomeComponent implements Component {
  bindings = [createBindingFromPermissions(permissions, '<module-name>')];
}
```

## Access control

Assuming authentication handled by
[@loopback/authentication](https://loopback.io/doc/en/lb4/Authentication-overview.html). Authentication expects user to
at least exist, if no authenticated user obtained from user will be denied.

```ts
// todo.controller.ts
import {SecurityBindings} from '@loopback/security';
import {inject} from '@loopback/context';
import {post, requestBody} from '@loopback/rest';
import {authorise} from '@loopback4-acl';

export class TodoController {
  constructor(
    @repository(TodoRepository)
    public todoRepository: TodoRepository,
  ) {}

  @authorise(Actions.create, Todo)
  @post('/todos', {
    responses: {
      '200': {
        description: 'Todo model instance',
        content: {'application/json': {schema: getModelSchemaRef(Todo)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Todo, {
            title: 'NewTodo',
            exclude: ['id'],
          }),
        },
      },
    })
    todo: Omit<Todo, 'id'>,
  ): Promise<Todo> {
    return this.todoRepository.create(todo);
  }
}
```

### Subject resolver

For permissions with conditions we need to provide subject resolver in `@authorise` decorator. It can be a provider or a
resolve function or a tuple.

```ts
// post.hook.ts
import {Provider} from '@loopback/context';
import {Request} from '@loopback/rest';
import {AuthContext} from 'loopback4-acl';

import {TodoRepository} from './repositories/post.repository';
import {Todo} from './model/post.model';

export class TodoResolver implements Provider<SubjectResolver<Todo>> {
  constructor(
    @repository(TodoRepository)
    readonly todoRepository: TodoRepository,
  ) {}

  action() {
    return (ctx: AuthContext) => this.resolve(ctx);
  }

  async resolve({params}: AuthContext) {
    return this.todoRepository.findById(parseInt(params.id));
  }
}
```

passed as third argument of `@authorise`

```ts
export class TodoController {
  // ...
  @authorise(Actions.update, Todo, TodoResolver)
  @patch('/todos/{id}', {
    responses: {
      '204': {
        description: 'Todo PATCH success',
      },
    },
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Todo, {partial: true}),
        },
      },
    })
    todo: Todo,
  ): Promise<void> {
    await this.todoRepository.updateById(id, todo);
  }

  // ...
}
```

Resolver provider or binding key are preferred method, it has full dependency injection support and can be reused.
Alternatively inline `tuple resolver` may be used, it can inject single repository or service and may be useful for
prototyping or single usage use cases.

```ts
export class TodoController {
  // ...
  @authorise<Todo>(Actions.update, Todo, [
    TodoRepository,
    (repo: TodoRepository, {params}) => repo.findById(parseInt(params.id)),
  ])
  @patch('/todos/{id}', {
    responses: {
      '204': {
        description: 'Todo PATCH success',
      },
    },
  })
  async updateTodo(
    @param.path.number('id')
    id: number,
    @requestBody()
    todo: Todo,
  ) {
    await this.todoRepository.updateById(id, todo);
  }

  // ...
}
```

### `@acl.subject` decorator

`@acl.subject` decorator provides access to lazy loaded subject, obtained from [subject resolver](#subject-resolver) and
bound to invocation context.

```ts
export class TodoController {
  // ...
  @authorise(Actions.update, Todo, TodoResolver)
  @patch('/todos/{id}', {
    responses: {
      '204': {
        description: 'Todo PATCH success',
      },
    },
  })
  async updateById(
    @param.path.number('id')
    id: number,
    @requestBody()
    todo: Todo,
    @acl.subject()
    subject: Todo,
  ) {
    // subject === await todoRepo.findById(id)
  }
  // ...
}
```

### `@cals.conditions` decorator

Permission conditions can be used in resolver through `@cals.conditions` decorator, ie to filter selected records.
Subject resolver is not required.

```ts
export class TodoController {
  @authorise(Actions.update, Todo)
  @patch('/todos/{id}', {
    responses: {
      '204': {
        description: 'Todo PATCH success',
      },
    },
  })
  async updateByIdConditionParamNoResolver(
    @param.path.number('id')
    id: number,
    @requestBody()
    todo: Todo,
    @acl.conditions()
    conditions: Conditions,
  ) {
    conditions.toSql(); // ['"userId" = $1', ['userId'], []]
    conditions.toMongo(); // { $or: [{ userId: 'userId' }] }
  }
}
```

### Testing

Check
[authorization_tests](https://github.com/betaly/loopback4-acl/tree/master/src/__tests__/acceptances/authorization.acceptance.ts)
for application testing example.

## Advanced usage

### Custom actions

Extending enums is a bit tricky in TypeScript There are multiple solutions described in
[this issue](https://github.com/microsoft/TypeScript/issues/17592) but this one is the simplest:

```ts
enum CustomActions {
  feature = 'feature',
}

export type Actions = DefaultActions | CustomActions;
export const Actions = {...DefaultActions, ...CustomActions};
```

## License

MIT © [TY](https://github.com/taoyuan)
