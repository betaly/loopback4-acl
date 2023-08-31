import {Component} from '@loopback/core';

import {createBindingFromPermissions} from '../../../../bindings';
import {TodoController} from './controllers';
import {Todo} from './models';
import {permissions} from './permissions';
import {TodoRepository} from './repositories';

export class TodoComponent implements Component {
  bindings = [createBindingFromPermissions(permissions, 'todo')];
  models = [Todo];
  repositories = [TodoRepository];
  controllers = [TodoController];
}
