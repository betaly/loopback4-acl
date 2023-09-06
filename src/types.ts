/* eslint-disable @typescript-eslint/no-explicit-any */

import {Abilities, AbilityTuple, AnyAbility, CanParameters} from '@casl/ability';
import {BindingAddress, Context, Provider} from '@loopback/context';
import {Constructor} from '@loopback/core';

import {Conditions} from './conditions';
import {AuthContext} from './context';
import {AnyPermissions} from './permissions';

export declare type AnyClass<R = any> = new (...args: any[]) => R;
export type AnyRecord = Record<PropertyKey, any>;
export type AnyObject = Record<PropertyKey, unknown>;

export type SingleOrArray<T> = T | T[];

export interface Able<User extends IAuthUserWithRoles = IAuthUserWithRoles, A extends Abilities = AbilityTuple> {
  readonly user: User;
  conditionsFor(...args: CanParameters<A>): Conditions | undefined;
  can(...args: CanParameters<A>): boolean;
  cannot(...args: CanParameters<A>): boolean;
}

export type AbilityFactory<T extends AnyAbility> = AnyClass<T> | ((rules?: any[], options?: any) => T);

export type PermissionsMetadata = AnyPermissions[];

export interface IAuthUserWithRoles<ROLE = string, ID = string> {
  id: ID;
  name?: string;
  role?: ROLE;
  roles?: ROLE[];
}

export type UserResolver<User extends IAuthUserWithRoles = IAuthUserWithRoles> = (
  context: Context,
) => Promise<User | undefined>;

export interface AclConfig {
  userResolver?: BindingAddress<IAuthUserWithRoles> | UserResolver;
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
