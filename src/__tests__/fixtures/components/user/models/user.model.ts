import {Entity, model, property} from '@loopback/repository';

import {IAuthUserWithRoles} from '../../../../../types';
import {Roles} from '../../../roles';

@model()
export class User extends Entity implements IAuthUserWithRoles<Roles> {
  @property({
    type: 'string',
    id: true,
    generated: false,
  })
  id: string;

  @property({
    type: 'array',
    itemType: 'string',
    required: true,
  })
  roles: Roles[];

  @property({
    type: 'string',
  })
  name?: string;

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations extends User {}
