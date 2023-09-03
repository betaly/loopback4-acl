import {Able} from '../types';

export class SuperUserAble implements Able {
  constructor() {}

  can(): boolean {
    return true;
  }

  cannot(): boolean {
    return false;
  }
}
