import {Able, IAuthUserWithRoles} from '../types';

export class SuperuserAble<User extends IAuthUserWithRoles = IAuthUserWithRoles> implements Able<User> {
  constructor(readonly user: User) {}

  conditionsFor() {
    return undefined;
  }

  can(): boolean {
    return true;
  }

  cannot(): boolean {
    return false;
  }
}
