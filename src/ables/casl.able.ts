import {AbilityTuple, AnyAbility, CanParameters} from '@casl/ability';

import {Able} from '../types';

export class CaslAble implements Able {
  constructor(private ability: AnyAbility) {}

  can(...args: CanParameters<AbilityTuple>): boolean {
    return this.ability.can(...args);
  }

  cannot(...args: CanParameters<AbilityTuple>): boolean {
    return this.ability.cannot(...args);
  }
}
