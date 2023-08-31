import {InferSubjects} from '@casl/ability';

import {Actions} from '../../../../actions';
import {Permissions} from '../../../../permissions';
import {Roles} from '../../roles';
import {Todo} from './models';

type Subjects = InferSubjects<typeof Todo>;

export const permissions: Permissions<Roles, Subjects, Actions> = {
  everyone({can}) {
    can(Actions.read, Todo);
  },
  customer({user, can}) {
    can(Actions.create, Todo);
    can(Actions.update, Todo, {userId: user.id});
  },
  operator({can, cannot}) {
    can(Actions.manage, Todo);
    cannot(Actions.delete, Todo);
  },
};
