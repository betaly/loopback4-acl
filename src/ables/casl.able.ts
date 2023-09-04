import {AbilityTuple, AnyAbility, CanParameters} from '@casl/ability';

import {Able, AuthUser} from '../types';

export class CaslAble<User extends AuthUser = AuthUser> implements Able<User> {
  constructor(readonly user: User, private ability: AnyAbility) {}

  can(...args: CanParameters<AbilityTuple>): boolean {
    return this.ability.can(...args);
  }

  cannot(...args: CanParameters<AbilityTuple>): boolean {
    return this.ability.cannot(...args);
  }
}
