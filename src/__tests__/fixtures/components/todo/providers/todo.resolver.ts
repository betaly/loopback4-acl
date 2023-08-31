import {Provider} from '@loopback/context';
import {repository} from '@loopback/repository';

import {AuthContext} from '../../../../../context';
import {SubjectResolveFn} from '../../../../../types';
import {Todo} from '../models';
import {TodoRepository} from '../repositories';

export class TodoResolver implements Provider<SubjectResolveFn<Todo>> {
  constructor(
    @repository(TodoRepository)
    private todoRepository: TodoRepository,
  ) {}

  value(): SubjectResolveFn<Todo> {
    return async ctx => this.resolve(ctx);
  }

  async resolve({params}: AuthContext) {
    return this.todoRepository.findById(parseInt(params.id));
  }
}
