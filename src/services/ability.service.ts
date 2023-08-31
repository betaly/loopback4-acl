import {AbilityOptionsOf, AnyAbility, createMongoAbility, Subject as CaslSubject} from '@casl/ability';
import {BindingScope} from '@loopback/context';
import {extensionPoint, extensions, Getter, inject} from '@loopback/core';
import debugFactory from 'debug';

import {DefaultActions} from '../actions';
import {PERMISSIONS_EXTENSION_POINT_NAME} from '../bindings';
import {CaslBindings} from '../keys';
import {AnyPermissions, UserAbilityBuilder} from '../permissions';
import {AbilityFactory, AuthUser} from '../types';
import {toArray} from '../utils';

const debug = debugFactory('casl:ability-service');

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
  Role extends string = string,
  Subject extends CaslSubject = CaslSubject,
  Actions extends string = DefaultActions,
  User extends AuthUser<Role, unknown> = AuthUser<Role, unknown>,
> {
  constructor(
    @extensions()
    private readonly getAllPermissions: Getter<AnyPermissions<Role, Subject, Actions, User>[]>,
    @inject.getter(CaslBindings.CURRENT_PERMISSIONS, {optional: true})
    private readonly getCurrentPermissions: Getter<AnyPermissions<Role, Subject, Actions, User>>,
  ) {}

  async buildForUser(user: User, options: AbilityServiceBuildOptions = {}): Promise<AnyAbility> {
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
      debug(`Using permissions from CaslBindings.CURRENT_PERMISSIONS injection`);
      perms = await this.getCurrentPermissions();
    }
    if (!perms) {
      debug(`Using permissions from all permissions extensions`);
      perms = await this.getAllPermissions();
    }

    const permissionsToUse = toArray(perms) as AnyPermissions<Role, Subject, Actions, User>[];

    const ability = new UserAbilityBuilder(user, permissionsToUse, abilityFactory);

    debug(`Applying everyone and every role permissions`);
    ability.permissionsFor('everyone');
    ability.permissionsFor('every');

    if (user.roles?.length) {
      debug(`Applying user roles [${user.roles.join(', ')}] permissions`);
      user.roles.forEach(role => ability.permissionsFor(role));
    }

    if (skipConditions) {
      debug(`Skipping conditions matcher`);
      return ability.build({...abilityOptions, conditionsMatcher: nullConditionsMatcher});
    }
    return ability.build(abilityOptions);
  }
}
