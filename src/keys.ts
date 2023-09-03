import {BindingKey} from '@loopback/context';

import {Conditions} from './conditions';
import {AclConfig, AuthHookFn, UserResolver} from './types';

export namespace AclBindings {
  export const CONFIG = BindingKey.create<AclConfig>('acl.config');
  export const AUTHORIZER = BindingKey.create('acl.authorizer');
  export const SUPERUSER_ROLE = BindingKey.create<string>('acl.superuserRole');
  export const USER_RESOLVER = BindingKey.create<UserResolver>('acl.userResolver');
  export const CURRENT_PERMISSIONS = BindingKey.create('acl.currentPermissions');
  export const SUBJECT = BindingKey.create('acl.subject');
  export const CONDITIONS = BindingKey.create<Conditions>('acl.conditions');
  export const ABLE = BindingKey.create('acl.able');

  export const Auth = {
    SUBJECT_HOOKS: BindingKey.create<AuthHookFn[]>('acl.auth.subjectHooks'),
  };
}

export namespace AclTags {
  export const SUBJECT = 'acl.subject';
}
