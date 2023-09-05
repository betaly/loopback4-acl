import {permissions, Role, User} from './commons/defines';
import {buildAbilityForUser, CaslAble} from '..';
import {subject} from '@casl/ability';

async function main() {
  const manager = new User({name: 'manager', role: Role.manager});
  const ability = await buildAbilityForUser(manager, permissions);
  const able = new CaslAble(ability, manager);

  const conditions = able.conditionsFor('create', User.name);
  const ast = conditions?.toAst();
  const sql = conditions?.toSql();
  console.log(ast);
  console.log(sql);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
