import {DecoratorFactory, MetadataAccessor, MetadataInspector} from '@loopback/context';
import {ClassDecoratorFactory, MethodDecoratorFactory} from '@loopback/core';

import {Permissions} from '../permissions';
import {PermissionsMetadata} from '../types';
import {toArray} from '../utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PermissionsOptions = Permissions<any> | Permissions<any>[];

export const PERMISSIONS_METHOD_KEY = MetadataAccessor.create<PermissionsMetadata, MethodDecorator>(
  'permissions:method',
);

export const PERMISSIONS_CLASS_KEY = MetadataAccessor.create<PermissionsMetadata, ClassDecorator>('permissions:class');

export function usePermissions(options: PermissionsOptions) {
  const spec = toArray(options);
  return function usePermissionsDecoratorForClassOrMethod(
    // Class or a prototype
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: any,
    method?: string,
    // Use `any` to for `TypedPropertyDescriptor`
    // See https://github.com/loopbackio/loopback-next/pull/2704
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    methodDescriptor?: TypedPropertyDescriptor<any>,
  ) {
    if (method && methodDescriptor) {
      // Method
      return MethodDecoratorFactory.createDecorator(PERMISSIONS_METHOD_KEY, spec, {decoratorName: '@usePermissions'})(
        target,
        method,
        methodDescriptor!,
      );
    }
    if (typeof target === 'function' && !method && !methodDescriptor) {
      // Class
      return ClassDecoratorFactory.createDecorator(PERMISSIONS_CLASS_KEY, spec, {decoratorName: '@usePermissions'})(
        target,
      );
    }
    // Not on a class or method
    throw new Error(
      '@intercept cannot be used on a property: ' + DecoratorFactory.getTargetName(target, method, methodDescriptor),
    );
  };
}

/**
 * Fetch permissions metadata stored by `@usePermissions` decorator.
 *
 * @param target Target object/class
 * @param methodName Target method
 */
export function getPermissionsMetadata(target: object, methodName: string): PermissionsMetadata | undefined {
  let targetClass: Function;
  if (typeof target === 'function') {
    targetClass = target;
    target = target.prototype;
  } else {
    targetClass = target.constructor;
  }
  const metadata = MetadataInspector.getMethodMetadata<PermissionsMetadata>(PERMISSIONS_METHOD_KEY, target, methodName);
  if (metadata) return metadata;
  // Check if the class level has `@authorize`
  return MetadataInspector.getClassMetadata<PermissionsMetadata>(PERMISSIONS_CLASS_KEY, targetClass);
}
