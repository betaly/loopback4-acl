import {BindingAddress, BindingSelector, isBindingAddress as _isBindingAddress} from '@loopback/context';

import {SubjectResolver} from './types';

export function isBindingAddress<T>(x: unknown): x is BindingAddress<T> {
  return _isBindingAddress(x as BindingSelector);
}

export function isSubjectResolver<T>(x: unknown): x is SubjectResolver<T> {
  return (Array.isArray(x) && x.length === 2) || isBindingAddress(x) || typeof x === 'function';
}

export function toArray<T>(x: T | T[]): NonNullable<T>[] {
  if (x == null) {
    return [];
  }
  return (Array.isArray(x) ? x : [x]) as NonNullable<T>[];
}
