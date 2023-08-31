import {AbilityBuilder, AnyAbility, Subject} from '@casl/ability';

import {DefaultActions} from './actions';
import {AbilityFactory, AuthUser} from './types';

export class UserAbilityBuilder<
  Subjects extends Subject = Subject,
  Actions extends string = DefaultActions,
  User extends AuthUser<unknown, unknown> = AuthUser,
> extends AbilityBuilder<AnyAbility> {
  constructor(
    public user: User,
    public permissions: AnyPermissions<string, Subjects, Actions, User>[],
    abilityFactory: AbilityFactory<AnyAbility>,
  ) {
    super(abilityFactory);
  }

  extend = (role: string): void => {
    this.permissionsFor(role);
  };

  permissionsFor(role: string): void {
    for (const p of this.permissions) {
      const rolePermissions = p[role];
      if (rolePermissions) {
        rolePermissions(this);
      }
    }
  }
}

export type DefinePermissions<
  Subjects extends Subject = Subject,
  Actions extends string = DefaultActions,
  User extends AuthUser<unknown, unknown> = AuthUser,
> = (builder: UserAbilityBuilder<Subjects, Actions, User>) => void;

export type Permissions<
  Roles extends string,
  Subjects extends Subject = Subject,
  Actions extends string = DefaultActions,
  User extends AuthUser<unknown, unknown> = AuthUser<Roles>,
> = Partial<Record<Roles | 'every' | 'everyone', DefinePermissions<Subjects, Actions, User>>>;

export type AnyPermissions<
  Roles extends string = string,
  Subjects extends Subject = Subject,
  Actions extends string = string,
  User extends AuthUser<unknown, unknown> = AuthUser<Roles>,
> = Permissions<Roles, Subjects, Actions, User>;
