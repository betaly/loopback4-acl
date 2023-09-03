import {AbilityOptionsOf, AnyAbility, createMongoAbility, Subject} from '@casl/ability';
import {BindingScope} from '@loopback/context';
import {extensionPoint, extensions, Getter, inject} from '@loopback/core';
import debugFactory from 'debug';

import {DefaultActions} from '../actions';
import {PERMISSIONS_EXTENSION_POINT_NAME} from '../bindings';
import {AclBindings} from '../keys';
import {AnyPermissions, UserAbilityBuilder} from '../permissions';
import {AbilityFactory, AuthUser} from '../types';
import {toArray} from '../utils';

const debug = debugFactory('acl:ability-service');

export type AbilityServiceBuildOptions =
  | AbilityFactory<AnyAbility>
  | ({
      abilityFactory?: AbilityFactory<AnyAbility>;
      skipConditions?: boolean;
      permissions?: AnyPermissions | AnyPermissions[];
    } & AbilityOptionsOf<AnyAbility>);

export const nullConditionsMatcher = () => (): boolean => true;

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
    private readonly getAllPermissions: Getter<AnyPermissions<TRole, TSubject, TAction, TUser>[]>,
    @inject.getter(AclBindings.CURRENT_PERMISSIONS, {optional: true})
    private readonly getCurrentPermissions: Getter<AnyPermissions<TRole, TSubject, TAction, TUser>>,
  ) {}

  async buildForUser(user: TUser, options: AbilityServiceBuildOptions = {}): Promise<AnyAbility> {
    debug(`Building ability for user ${user.id}`);
    const {
      abilityFactory = createMongoAbility,
      skipConditions = false,
      permissions = undefined,
      ...abilityOptions
    } = typeof options === 'function' ? {abilityFactory: options} : options;

    let perms;
    if (permissions) {
      debug(`Using permissions in options passed`);
      perms = permissions;
    }
    if (!perms) {
      debug(`Using permissions from AclBindings.CURRENT_PERMISSIONS injection`);
      perms = await this.getCurrentPermissions();
    }
    if (!perms) {
      debug(`Using permissions from all permissions extensions`);
      perms = await this.getAllPermissions();
    }

    const permissionsToUse = toArray(perms) as AnyPermissions<TRole, TSubject, TAction, TUser>[];

    const ability = new UserAbilityBuilder(user, permissionsToUse, abilityFactory);

    debug(`Applying everyone and every role permissions`);
    ability.permissionsFor('everyone');
    ability.permissionsFor('every');

    const roles = toArray(user.roles ?? user.role);

    if (roles.length > 0) {
      debug(`Applying user roles [${roles.join(', ')}] permissions`);
      roles.forEach(role => ability.permissionsFor(role));
    }

    if (skipConditions) {
      debug(`Skipping conditions matcher`);
      return ability.build({...abilityOptions, conditionsMatcher: nullConditionsMatcher});
    }
    return ability.build(abilityOptions);
  }
}
