import {AbilityBuilder, AnyAbility, Subject} from '@casl/ability';

import {DefaultActions} from './actions';
import {AbilityFactory, AuthUser} from './types';

export class UserAbilityBuilder<
  TSubject extends Subject = Subject,
  TAction extends string = DefaultActions,
  TUser extends AuthUser<unknown, unknown> = AuthUser,
> extends AbilityBuilder<AnyAbility> {
  constructor(
    public user: TUser,
    public permissions: AnyPermissions<string, TSubject, TAction, TUser>[],
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
  TSubject extends Subject = Subject,
  TAction extends string = DefaultActions,
  TUser extends AuthUser<unknown, unknown> = AuthUser,
> = (builder: UserAbilityBuilder<TSubject, TAction, TUser>) => void;

export type Permissions<
  TRole extends string,
  TSubject extends Subject = Subject,
  TAction extends string = DefaultActions,
  TUser extends AuthUser<unknown, unknown> = AuthUser<TRole>,
> = Partial<Record<TRole | 'every' | 'everyone', DefinePermissions<TSubject, TAction, TUser>>>;

export type AnyPermissions<
  TRole extends string = string,
  TSubject extends Subject = Subject,
  TAction extends string = string,
  TUser extends AuthUser<unknown, unknown> = AuthUser<TRole>,
> = Permissions<TRole, TSubject, TAction, TUser>;
