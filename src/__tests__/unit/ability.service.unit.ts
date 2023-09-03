import {Actions} from '../../actions';
import {AclBindings} from '../../keys';
import {Permissions} from '../../permissions';
import {AbilityService} from '../../services';
import {TestAuthorizationApplication} from '../fixtures/application';
import {Todo} from '../fixtures/components/todo';
import {Roles} from '../fixtures/roles';
import {setupApplication} from '../test-helper';

const permissions: Permissions<Roles> = {
  everyone({can}) {
    can(Actions.read, Todo);
  },

  customer({can}) {
    can(Actions.create, Todo);
    can(Actions.delete, Todo);
  },

  operator({can, cannot, extend}) {
    extend(Roles.customer);

    can(Actions.update, Todo);
    cannot(Actions.delete, Todo);
  },
};

const permissionsEveryAlias: Permissions<Roles> = {
  every({can}) {
    can(Actions.read, Todo);
  },

  customer({can}) {
    can(Actions.create, Todo);
    can(Actions.delete, Todo);
  },
};

const permissionsNoEveryone: Permissions<Roles> = {
  customer({can}) {
    can(Actions.create, Todo);
    can(Actions.delete, Todo);
  },
};

describe('AbilityService', () => {
  let app: TestAuthorizationApplication;
  let abilityService: AbilityService;

  beforeEach(async () => {
    ({app} = await setupApplication());
  });

  beforeEach(async () => {
    abilityService = await app.get<AbilityService>(`services.${AbilityService.name}`);
  });

  afterEach(async () => {
    await app.stop();
  });

  it("everyone's rules applied to customer", async () => {
    app.bind(AclBindings.CURRENT_PERMISSIONS).to(permissions);
    const user = {id: 'userId', roles: [Roles.customer]};
    const ability = await abilityService.buildForUser(user);
    expect(ability.can(Actions.read, Todo)).toBe(true);
  });

  it('every is an alias for everyone', async () => {
    app.bind(AclBindings.CURRENT_PERMISSIONS).to(permissionsEveryAlias);
    const user = {id: 'userId', roles: [Roles.customer]};
    const ability = await abilityService.buildForUser(user);
    expect(ability.can(Actions.read, Todo)).toBe(true);
  });

  it('works without everyone role', async () => {
    app.bind(AclBindings.CURRENT_PERMISSIONS).to(permissionsNoEveryone);
    const user = {id: 'userId', roles: [Roles.customer]};
    const ability = await abilityService.buildForUser(user);
    expect(ability.can(Actions.read, Todo)).toBe(false);
  });

  it('operator inherits rules from user', async () => {
    app.bind(AclBindings.CURRENT_PERMISSIONS).to(permissions);
    const user = {id: 'userId', roles: [Roles.operator]};
    const ability = await abilityService.buildForUser(user);
    expect(ability.can(Actions.read, Todo)).toBe(true);
    expect(ability.can(Actions.create, Todo)).toBe(true);
    expect(ability.can(Actions.update, Todo)).toBe(true);
    expect(ability.can(Actions.delete, Todo)).toBe(false);
  });
});
