/* eslint-disable @typescript-eslint/no-explicit-any */

import {AnyAbility} from '@casl/ability';
import {BindingAddress, Context, Provider} from '@loopback/context';
import {Constructor} from '@loopback/core';

import {AuthContext} from './context';
import {Permissions} from './permissions';

export declare type AnyClass<R = any> = new (...args: any[]) => R;
export type AnyRecord = Record<PropertyKey, any>;
export type AnyObject = Record<PropertyKey, unknown>;

export type AbilityFactory<T extends AnyAbility> = AnyClass<T> | ((rules?: any[], options?: any) => T);

export type PermissionsMetadata = Permissions<any>[];

export interface AuthUser<ROLE = string, ID = string> {
  id: ID;
  role?: ROLE;
  roles?: ROLE[];
}

export type UserResolver<User extends AuthUser = AuthUser> = (context: Context) => Promise<User | undefined>;

export interface CaslConfig {
  userResolver?: BindingAddress<AuthUser> | UserResolver;
  superuserRole?: string;
}

export type AuthHookFn = (context: AuthContext) => Promise<void>;

export type SubjectResolveFn<Subject = AnyObject> = (context: AuthContext) => Promise<Subject | undefined>;

export type SubjectResolverProvider<Subject = AnyObject> = Constructor<Provider<SubjectResolveFn<Subject>>>;

export type SubjectResolveTuple<Subject = AnyObject> = [
  AnyClass | BindingAddress<AnyClass>,
  (service: InstanceType<AnyClass>, context: AuthContext) => Promise<Subject>,
];

export type SubjectResolver<Subject = AnyObject> =
  | BindingAddress<SubjectResolveFn<Subject>>
  | SubjectResolveFn<Subject>
  | SubjectResolverProvider<Subject>
  | SubjectResolveTuple<Subject>;
