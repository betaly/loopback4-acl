import {Able, AuthUser} from '../types';

export class SuperuserAble<User extends AuthUser = AuthUser> implements Able<User> {
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
