import {AbilityOptionsOf, AnyAbility, createMongoAbility, Subject} from '@casl/ability';
import debugFactory from 'debug';

import {DefaultActions} from './actions';
import {AnyPermissions, Permissions, UserAbilityBuilder} from './permissions';
import {AbilityFactory, IAuthUserWithRoles, SingleOrArray} from './types';
import {toArray} from './utils';

const debug = debugFactory('acl:ability-builder');

export interface AbilityBuildOptions<T extends AnyAbility> extends AbilityOptionsOf<T> {
  abilityFactory?: AbilityFactory<T>;
  skipConditions?: boolean;
}

export const nullConditionsMatcher = () => (): boolean => true;

export async function buildAbilityForUser<
  TRole extends string = string,
  TSubject extends Subject = Subject,
  TAction extends string = DefaultActions,
  TUser extends IAuthUserWithRoles<TRole, unknown> = IAuthUserWithRoles<TRole, unknown>,
>(
  user: TUser,
  permissions: SingleOrArray<AnyPermissions> | SingleOrArray<Permissions<TRole, [TAction, TSubject], TUser>>,
  options: AbilityFactory<AnyAbility> | AbilityBuildOptions<AnyAbility> = {},
): Promise<AnyAbility> {
  debug(`Building ability for user ${user.id}`);
  const {
    abilityFactory = createMongoAbility,
    skipConditions = false,
    ...abilityOptions
  } = typeof options === 'function' ? {abilityFactory: options} : options;

  const ability = new UserAbilityBuilder(
    user,
    toArray(permissions) as Permissions<TRole, [TAction, TSubject], TUser>[],
    abilityFactory,
  );

  debug(`Applying everyone and every role permissions`);
  ability.permissionsFor('everyone');
  ability.permissionsFor('every');

  const roles: TRole[] = toArray(user.roles ?? user.role);

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
