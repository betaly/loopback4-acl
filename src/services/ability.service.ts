import {AnyAbility, Subject} from '@casl/ability';
import {BindingScope} from '@loopback/context';
import {extensionPoint, extensions, Getter, inject} from '@loopback/core';
import debugFactory from 'debug';

import {AbilityBuildOptions, buildAbilityForUser} from '../ability-builder';
import {DefaultActions} from '../actions';
import {PERMISSIONS_EXTENSION_POINT_NAME} from '../bindings';
import {AclBindings} from '../keys';
import {AnyPermissions} from '../permissions';
import {AbilityFactory, AuthUser, SingleOrArray} from '../types';

const debug = debugFactory('acl:ability-service');

export interface AbilityServiceBuildOptions<T extends AnyAbility> extends AbilityBuildOptions<T> {
  permissions?: SingleOrArray<AnyPermissions>;
}

@extensionPoint(PERMISSIONS_EXTENSION_POINT_NAME, {
  scope: BindingScope.SINGLETON,
})
export class AbilityService<
  TRole extends string = string,
  TSubject extends Subject = Subject,
  TAction extends string = DefaultActions,
  TUser extends AuthUser<TRole, unknown> = AuthUser<TRole, unknown>,
> {
  constructor(
    @extensions()
    private readonly getAllPermissions: Getter<AnyPermissions<TRole, [TAction, TSubject], TUser>[]>,
    @inject.getter(AclBindings.CURRENT_PERMISSIONS, {optional: true})
    private readonly getCurrentPermissions: Getter<AnyPermissions<TRole, [TAction, TSubject], TUser>>,
  ) {}

  async buildForUser(
    user: TUser,
    options: AbilityFactory<AnyAbility> | AbilityServiceBuildOptions<AnyAbility> = {},
  ): Promise<AnyAbility> {
    let permissions;
    if (typeof options !== 'function' && options.permissions) {
      debug(`Using permissions in options passed`);
      permissions = options.permissions;
    }
    if (!permissions) {
      debug(`Using permissions from AclBindings.CURRENT_PERMISSIONS injection`);
      permissions = await this.getCurrentPermissions();
    }
    if (!permissions) {
      debug(`Using permissions from all permissions extensions`);
      permissions = await this.getAllPermissions();
    }
    return buildAbilityForUser(user, permissions, options);
  }
}
