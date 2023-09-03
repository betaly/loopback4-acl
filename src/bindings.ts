import {Binding, BindingTemplate} from '@loopback/context';
import {extensionFor} from '@loopback/core';

import {Permissions} from './permissions';

export const PERMISSIONS_NAMESPACE = 'permissions';

/**
 * Name/id of the permissions extension point
 */
export const PERMISSIONS_EXTENSION_POINT_NAME = 'acl-permissions';

/**
 * A binding template for permissions extensions
 */
export const asPermissions: BindingTemplate = binding => {
  extensionFor(PERMISSIONS_EXTENSION_POINT_NAME)(binding);
  binding.tag({namespace: 'permissions'});
};

export function createBindingFromPermissions<Roles extends string>(permissions: Permissions<Roles>, name: string) {
  return new Binding<Permissions<Roles>>(`${PERMISSIONS_NAMESPACE}.${name}`).to(permissions).apply(asPermissions);
}
