export enum DefaultActions {
  create = 'create',
  read = 'read',
  read_any = 'read_any',
  update = 'update',
  update_any = 'update_any',
  delete = 'delete',
  delete_any = 'delete_any',
  execute = 'execute',
  manage = 'manage',
}

export type Actions = DefaultActions;
export const Actions = DefaultActions;
