import {uid} from 'uid';

import {Actions, Permissions} from '../..';

export enum Role {
  admin = 'admin',
  manager = 'manager',
  member = 'member',
}

export class User {
  id: string;
  name: string;
  role: Role;

  constructor(data: Partial<User>) {
    this.id = uid();
    Object.assign(this, data);
  }
}

export type Subjects = 'all' | 'User';

export const permissions: Permissions<Role, [Actions, Subjects]> = {
  [Role.member]: ({user, can, cannot}) => {
    can(Actions.create, 'User', {role: Role.member});
    can(Actions.read, 'User', {id: user.id});
    can(Actions.update, 'User', {id: user.id});
    can(Actions.execute, 'User', {id: user.id});
  },
  [Role.manager]: ({user, can, cannot, extend}) => {
    extend(Role.member);
    can(Actions.create, 'User', {role: Role.manager});
    can(Actions.read, 'User', {role: {$in: [Role.member, Role.manager]}});
    can(Actions.update, 'User', {role: {$in: [Role.member, Role.manager]}});
    can(Actions.delete, 'User', {role: {$in: [Role.member, Role.manager]}});
  },
  [Role.admin]: ({can, extend}) => {
    can(Actions.manage, 'all');
  },
};
