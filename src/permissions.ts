/* eslint-disable @typescript-eslint/no-explicit-any */

import {AbilityBuilder, AnyAbility, PureAbility, Subject} from '@casl/ability';
import {Abilities} from '@casl/ability/dist/types/types';

import {DefaultActions} from './actions';
import {AbilityFactory, IAuthUserWithRoles} from './types';

export class UserAbilityBuilder<
  TAbilities extends Abilities = [DefaultActions, Subject],
  TUser extends IAuthUserWithRoles<unknown, unknown> = IAuthUserWithRoles,
> extends AbilityBuilder<PureAbility<TAbilities>> {
  constructor(
    public user: TUser,
    public permissions: AnyPermissions<string, TAbilities, TUser>[],
    abilityFactory: AbilityFactory<AnyAbility>,
  ) {
    super(abilityFactory as any);
  }

  extend = (role: string): void => {
    this.permissionsFor(role);
  };

  protected permissionsFor(role: string): void {
    for (const p of this.permissions) {
      const rolePermissions = p[role];
      if (rolePermissions) {
        rolePermissions(this);
      }
    }
  }
}

export type DefinePermissions<
  TAbilities extends Abilities = [DefaultActions, Subject],
  TUser extends IAuthUserWithRoles<unknown, unknown> = IAuthUserWithRoles,
> = (builder: UserAbilityBuilder<TAbilities, TUser>) => void;

export type Permissions<
  TRole extends string,
  TAbilities extends Abilities = [DefaultActions, Subject],
  TUser extends IAuthUserWithRoles<unknown, unknown> = IAuthUserWithRoles<TRole>,
> = Partial<Record<TRole | 'every' | 'everyone', DefinePermissions<TAbilities, TUser>>>;

export type AnyPermissions<
  TRole extends string = any,
  TAbilities extends Abilities = any,
  TUser extends IAuthUserWithRoles<unknown, unknown> = any,
> = Permissions<TRole, TAbilities, TUser>;
