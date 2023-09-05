import {subject} from '@casl/ability';

import {Actions, buildAbilityForUser} from '..';
import {permissions, Role, User} from './commons/defines';

async function main() {
  const memberUser = new User({name: 'member', role: Role.member});
  const otherMemberUser = new User({name: 'member other', role: Role.member});
  const managerUser = new User({name: 'manager', role: Role.manager});
  const otherManagerUser = new User({name: 'manager other', role: Role.manager});
  const adminUser = new User({name: 'admin', role: Role.admin});
  const otherAdminUser = new User({name: 'admin other', role: Role.admin});

  const memberAbility = await buildAbilityForUser(memberUser, permissions);
  const managerAbility = await buildAbilityForUser(managerUser, permissions);
  const adminAbility = await buildAbilityForUser(adminUser, permissions);

  const subjectUser = (user: User) => subject(User.name, user);

  // console.log(memberAbility.relevantRuleFor(Actions.update, subject(User.name, subjectUser(memberUser))));

  console.log('-----------------');
  console.log('member abilities:');
  console.log('-----------------');
  console.log('- CREATE');
  console.log('member can create User', memberAbility.can(Actions.create, User.name));
  console.log('member can not create Self', memberAbility.cannot(Actions.create, subjectUser(managerUser)));
  console.log('member can not create User admin', memberAbility.cannot(Actions.create, subjectUser(adminUser)));
  console.log('- READ');
  console.log('member can read User', memberAbility.can(Actions.read, User.name));
  console.log('member can not read Self', memberAbility.cannot(Actions.read, subjectUser(managerUser)));
  console.log('member can not read User admin', memberAbility.cannot(Actions.read, subjectUser(adminUser)));
  console.log('- UPDATE');
  console.log('member can update User', memberAbility.can(Actions.update, User.name));
  console.log('member can update Self', memberAbility.can(Actions.update, subjectUser(memberUser)));
  console.log('member can not update User manager', memberAbility.cannot(Actions.update, subjectUser(managerUser)));
  console.log('member can not update User admin', memberAbility.cannot(Actions.update, subjectUser(adminUser)));
  console.log('- DELETE');
  console.log('member can not delete User', memberAbility.cannot(Actions.delete, User.name));
  console.log('member can not delete User manager', memberAbility.cannot(Actions.delete, subjectUser(managerUser)));
  console.log('member can not delete User admin', memberAbility.cannot(Actions.delete, subjectUser(adminUser)));
  console.log('- EXECUTE');
  console.log('member can execute User', memberAbility.can(Actions.execute, User.name));
  console.log('member can execute Self', memberAbility.can(Actions.execute, subjectUser(memberUser)));
  console.log(
    'member can not execute Other member',
    memberAbility.cannot(Actions.execute, subjectUser(otherMemberUser)),
  );
  console.log('member can not execute User manager', memberAbility.cannot(Actions.execute, subjectUser(managerUser)));
  console.log('member can not execute User admin', memberAbility.cannot(Actions.execute, subjectUser(adminUser)));

  console.log();
  console.log('------------------');
  console.log('manager abilities:');
  console.log('------------------');
  console.log('- CREATE');
  console.log('manager can create User', managerAbility.can(Actions.create, User.name));
  console.log('manager can not create User admin', managerAbility.cannot(Actions.create, subjectUser(adminUser)));
  console.log('- READ');
  console.log('manager can read User', managerAbility.can(Actions.read, User.name));
  console.log('manager can read Self', managerAbility.can(Actions.read, subjectUser(managerUser)));
  // console.log('manager can not read other member', managerAbility.cannot(Actions.read, subjectUser(memberUser));
  console.log('manager can not read User admin', managerAbility.cannot(Actions.read, subjectUser(adminUser)));
  console.log('- UPDATE');
  console.log('manager can update User', managerAbility.can(Actions.update, User.name));
  console.log('manager can update Self', managerAbility.can(Actions.update, subjectUser(managerUser)));
  console.log('manager can not update User admin', managerAbility.cannot(Actions.update, subjectUser(adminUser)));
  console.log('- DELETE');
  console.log('manager can delete User', managerAbility.can(Actions.delete, User.name));
  console.log('manager can delete Self', managerAbility.can(Actions.delete, subjectUser(managerUser)));
  console.log('manager can not delete User admin', managerAbility.cannot(Actions.delete, subjectUser(adminUser)));
  console.log('- EXECUTE');
  console.log('manager can execute User', managerAbility.can(Actions.execute, User.name));
  console.log('manager can execute Self', managerAbility.can(Actions.execute, subjectUser(managerUser)));
  console.log(
    'manager can not execute Other manager',
    managerAbility.cannot(Actions.execute, subjectUser(otherManagerUser)),
  );
  console.log('manager can not execute User admin', managerAbility.cannot(Actions.execute, subjectUser(adminUser)));
  console.log();
  console.log('----------------');
  console.log('admin abilities:');
  console.log('----------------');
  console.log('- CREATE');
  console.log('admin can create User', adminAbility.can(Actions.create, User.name));
  console.log('admin can create Self', adminAbility.can(Actions.create, subjectUser(adminUser)));
  console.log('- READ');
  console.log('admin can read User', adminAbility.can(Actions.read, User.name));
  console.log('admin can read Self', adminAbility.can(Actions.read, subjectUser(adminUser)));
  console.log('admin can read Other admin', adminAbility.can(Actions.read, subjectUser(otherAdminUser)));
  console.log('- UPDATE');
  console.log('admin can update User', adminAbility.can(Actions.update, User.name));
  console.log('admin can update Self', adminAbility.can(Actions.update, subjectUser(adminUser)));
  console.log('admin can update Other admin', adminAbility.can(Actions.update, subjectUser(otherAdminUser)));
  console.log('- DELETE');
  console.log('admin can delete User', adminAbility.can(Actions.delete, User.name));
  console.log('admin can delete Self', adminAbility.can(Actions.delete, subjectUser(adminUser)));
  console.log('admin can delete Other admin', adminAbility.can(Actions.delete, subjectUser(otherAdminUser)));
  console.log('- EXECUTE');
  console.log('admin can execute User', adminAbility.can(Actions.execute, User.name));
  console.log('admin can execute Self', adminAbility.can(Actions.execute, subjectUser(adminUser)));
  console.log('admin can execute Other admin', adminAbility.can(Actions.execute, subjectUser(otherAdminUser)));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
