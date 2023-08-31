import {BindingKey} from '@loopback/context';

import {Conditions} from './conditions';
import {AuthHookFn, CaslConfig, UserResolver} from './types';

export namespace CaslBindings {
  export const CONFIG = BindingKey.create<CaslConfig>('casl.config');
  export const AUTHORIZER = BindingKey.create('casl.authorizer');
  export const SUPERUSER_ROLE = BindingKey.create<string>('casl.superuserRole');
  export const USER_RESOLVER = BindingKey.create<UserResolver>('casl.userResolver');
  export const CURRENT_PERMISSIONS = BindingKey.create('casl.currentPermissions');
  export const SUBJECT = BindingKey.create('casl.subject');
  export const CONDITIONS = BindingKey.create<Conditions>('casl.conditions');

  export namespace Auth {
    export const SUBJECT_HOOKS = BindingKey.create<AuthHookFn[]>('casl.auth.subjectHooks');
  }
}
