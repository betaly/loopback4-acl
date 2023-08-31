import {Component} from '@loopback/core';

import {User} from './models';
import {UserRepository} from './repositories';

export class UserComponent implements Component {
  models = [User];
  repositories = [UserRepository];
}
