import {AbilityTuple, AnyAbility, CanParameters} from '@casl/ability';

import {Conditions} from '../conditions';
import {Able, AuthUser} from '../types';

export class CaslAble<User extends AuthUser = AuthUser> implements Able<User> {
  constructor(private ability: AnyAbility, readonly user: User) {}

  conditionsFor(...args: CanParameters<AbilityTuple, false>): Conditions | undefined {
    return new Conditions(this.ability, ...args);
  }

  can(...args: CanParameters<AbilityTuple>): boolean {
    return this.ability.can(...args);
  }

  cannot(...args: CanParameters<AbilityTuple>): boolean {
    return this.ability.cannot(...args);
  }
}
