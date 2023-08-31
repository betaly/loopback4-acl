import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, requestBody} from '@loopback/rest';
import {BErrors} from 'berrors';

import {Actions} from '../../../../../actions';
import {Conditions, SqlConditions} from '../../../../../conditions';
import {ability, casl, usePermissions} from '../../../../../decorators';
import {Todo} from '../models';
import {permissions} from '../permissions';
import {TodoResolver} from '../providers/todo.resolver';
import {TodoRepository} from '../repositories';

const UpdateVerbSpec = {
  responses: {
    '204': {
      description: 'Todo PATCH success',
    },
  },
};

const UpdateRequestBodySpec = {
  content: {
    'application/json': {
      schema: getModelSchemaRef(Todo, {partial: true}),
    },
  },
};

@usePermissions(permissions)
export class TodoController {
  constructor(
    @repository(TodoRepository)
    public todoRepository: TodoRepository,
  ) {}

  @ability(Actions.create, Todo)
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

  @ability(Actions.read, Todo)
  @get('/todos/{id}', {
    responses: {
      '200': {
        description: 'Todo model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Todo, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Todo, {exclude: 'where'}) filter?: FilterExcludingWhere<Todo>,
  ): Promise<Todo> {
    return this.todoRepository.findById(id, filter);
  }

  @ability(Actions.read, Todo)
  @get('/todos', {
    responses: {
      '200': {
        description: 'Array of Todo model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Todo, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(@param.filter(Todo) filter?: Filter<Todo>): Promise<Todo[]> {
    return this.todoRepository.find(filter);
  }

  @ability(Actions.delete, Todo)
  @del('/todos/{id}', {
    responses: {
      '204': {
        description: 'Todo DELETE success',
      },
    },
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.todoRepository.deleteById(id);
  }

  @ability(Actions.read, Todo)
  @get('/todos/count', {
    responses: {
      '200': {
        description: 'Todo model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(@param.where(Todo) where?: Where<Todo>): Promise<Count> {
    return this.todoRepository.count(where);
  }

  @ability(Actions.update, Todo)
  @patch('/todos', {
    responses: {
      '200': {
        description: 'Todo PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Todo, {partial: true}),
        },
      },
    })
    todo: Todo,
    @param.where(Todo) where?: Where<Todo>,
  ): Promise<Count> {
    return this.todoRepository.updateAll(todo, where);
  }

  @ability(Actions.update, Todo)
  @put('/todos/{id}', {
    responses: {
      '204': {
        description: 'Todo PUT success',
      },
    },
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() todo: Todo): Promise<void> {
    await this.todoRepository.replaceById(id, todo);
  }

  @ability(Actions.update, Todo, TodoResolver)
  @patch('/todos/{id}', UpdateVerbSpec)
  async updateById(
    @param.path.number('id') id: number,
    @requestBody(UpdateRequestBodySpec)
    todo: Todo,
  ): Promise<void> {
    await this.todoRepository.updateById(id, todo);
  }

  @ability(Actions.update, Todo, [
    TodoRepository,
    (todoRepository: TodoRepository, {params}) => todoRepository.findById(parseInt(params.id)),
  ])
  @patch('/todos/updateByIdTupleResolver/{id}', UpdateVerbSpec)
  async updateByIdTupleResolver(
    @param.path.number('id') id: number,
    @requestBody(UpdateRequestBodySpec)
    todo: Todo,
  ): Promise<void> {
    await this.todoRepository.updateById(id, todo);
  }

  @ability(Actions.update, Todo)
  @patch('/todos/updateByIdNoResolver/{id}', UpdateVerbSpec)
  async updateByIdNoResolver(
    @param.path.number('id') id: number,
    @requestBody(UpdateRequestBodySpec)
    todo: Todo,
  ): Promise<void> {
    await this.todoRepository.updateById(id, todo);
  }

  @ability(Actions.update, Todo, TodoResolver)
  @patch('/todos/updateByIdSubjectParam/{id}', UpdateVerbSpec)
  async updateByIdSubjectParam(
    @param.path.number('id') id: number,
    @requestBody(UpdateRequestBodySpec)
    todo: Todo,
    @casl.subject()
    subject: Todo,
  ): Promise<Todo> {
    if (!subject) {
      throw new BErrors.NotFound(`Subject todo ${id} not found`);
    }
    await this.todoRepository.updateById(id, todo);
    return this.todoRepository.findById(id);
  }

  @ability(Actions.update, Todo, [
    TodoRepository,
    (todoRepository: TodoRepository, {params}) => todoRepository.findById(parseInt(params.id)),
  ])
  @patch('/todos/updateByIdSubjectParamTuple/{id}', UpdateVerbSpec)
  async updateByIdSubjectParamTuple(
    @param.path.number('id') id: number,
    @requestBody(UpdateRequestBodySpec)
    todo: Todo,
    @casl.subject()
    subject: Todo,
  ): Promise<Todo> {
    if (!subject) {
      throw new BErrors.NotFound(`Subject todo ${id} not found`);
    }
    await this.todoRepository.updateById(id, todo);
    return this.todoRepository.findById(id);
  }

  // TODO - implement conditions functions
  @ability(Actions.update, Todo, TodoResolver)
  @patch('/todos/updateByIdConditionsParam/{id}')
  async updateByIdConditionsParam(
    @param.path.number('id') id: number,
    @requestBody(UpdateRequestBodySpec)
    todo: Todo,
    @casl.conditions()
    conditions?: Conditions,
  ): Promise<SqlConditions | undefined> {
    await this.todoRepository.updateById(id, todo);
    if (conditions) {
      return conditions.toSql();
    }
  }

  @ability(Actions.update, Todo)
  @patch('/todos/updateByIdConditionsParamNoResolver/{id}')
  async updateByIdConditionsParamNoResolver(
    @param.path.number('id') id: number,
    @requestBody(UpdateRequestBodySpec)
    todo: Todo,
    @casl.conditions()
    conditions?: Conditions,
  ): Promise<SqlConditions | undefined> {
    await this.todoRepository.updateById(id, todo);
    if (conditions) {
      return conditions.toSql();
    }
  }
}
