import {uid} from 'uid';
import {Actions, Permissions, InferSubjects} from '../..';

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

export type Subject = InferSubjects<typeof User>;

export const permissions: Permissions<Role, Subject, Actions> = {
  [Role.member]: ({user, can, cannot}) => {
    can(Actions.create, User.name, {role: Role.member});
    can(Actions.read, User.name, {id: user.id});
    can(Actions.update, User.name, {id: user.id});
    can(Actions.execute, User.name, {id: user.id});
  },
  [Role.manager]: ({user, can, cannot, extend}) => {
    extend(Role.member);
    can(Actions.create, User.name, {role: Role.manager});
    can(Actions.read, User.name, {role: {$in: [Role.member, Role.manager]}});
    can(Actions.update, User.name, {role: {$in: [Role.member, Role.manager]}});
    can(Actions.delete, User.name, {role: {$in: [Role.member, Role.manager]}});
  },
  [Role.admin]: ({can, extend}) => {
    can(Actions.create, 'all');
    can(Actions.read, 'all');
    can(Actions.update, 'all');
    can(Actions.delete, 'all');
    can(Actions.execute, 'all');
  },
};
