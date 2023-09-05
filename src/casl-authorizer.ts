import {subject} from '@casl/ability';
import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationMetadata,
  AuthorizationTags,
  Authorizer,
} from '@loopback/authorization';
import {BindingScope, injectable, Provider} from '@loopback/context';
import {Getter, inject, service} from '@loopback/core';
import debugFactory from 'debug';

import {CaslAble, SuperuserAble} from './ables';
import {Actions} from './actions';
import {Conditions} from './conditions';
import {getPermissionsMetadata} from './decorators';
import {AclBindings} from './keys';
import {AbilityService} from './services';
import {sureRunSubjectHooks} from './subjects';
import {UserResolver} from './types';
import {toArray} from './utils';

const debug = debugFactory('acl:authorizer');

@injectable({
  scope: BindingScope.SINGLETON,
  tags: [AuthorizationTags.AUTHORIZER],
})
export class CaslAuthorizer implements Provider<Authorizer> {
  constructor(
    @service(AbilityService)
    private abilityService: AbilityService,
    @inject(AclBindings.USER_RESOLVER, {optional: true})
    private resolveUser: UserResolver,
    @inject.getter(AclBindings.SUPERUSER_ROLE, {optional: true})
    private getSuperUserRole?: Getter<string>,
  ) {}

  value(): Authorizer {
    return (authorizationCtx, metadata) => this.authorize(authorizationCtx, metadata);
  }

  async authorize(
    authorizationCtx: AuthorizationContext,
    metadata: AuthorizationMetadata,
  ): Promise<AuthorizationDecision> {
    const {invocationContext} = authorizationCtx;
    const user = await this.resolveUser(invocationContext);
    if (!user) {
      debug(
        'current user not found. maybe not logged in or forgot to alias real user biding key to AclBindings.CURRENT_USER in CaslComponent initialization',
      );
      return AuthorizationDecision.ABSTAIN;
    }

    const roles = toArray(user.roles ?? user.role);

    const superuserRole = await this.getSuperUserRole?.();
    if (superuserRole && roles.includes(superuserRole)) {
      debug('superuser access granted');
      debug('Binding AclBindings.ABLE to superuser "able" of %s', user.name);
      invocationContext.bind(AclBindings.ABLE).to(new SuperuserAble(user));
      return AuthorizationDecision.ALLOW;
    }

    const sub = metadata.resource ?? authorizationCtx.resource;
    const act = metadata.scopes?.[0] ?? Actions.execute;

    const permissions = getPermissionsMetadata(invocationContext.target, invocationContext.methodName);
    const ability = await this.abilityService.buildForUser(user, {permissions});
    debug('Binding AclBindings.ABLE to ability of "%s" with roles [%s]', user.name, roles.join(','));
    invocationContext.bind(AclBindings.ABLE).to(new CaslAble(ability, user));

    const rules = ability.rulesFor(act, sub);
    debug('Binding AclBindings.CONDITIONS to rules for %s %s: %o', act, sub, rules);
    invocationContext.bind(AclBindings.CONDITIONS).to(new Conditions(ability, act, sub));

    if (!rules.every(rule => rule.conditions) || !invocationContext.isBound(AclBindings.Auth.SUBJECT_HOOKS)) {
      debug('authorize "%s" "%s" with class or type', act, sub);
      return decision(ability.can(act, sub));
    }

    await sureRunSubjectHooks(invocationContext);

    const instance = await invocationContext.get(AclBindings.SUBJECT, {optional: true});

    if (!instance) {
      debug('authorize "%s" "%s" with class or type', act, sub);
      return decision(ability.can(act, sub));
    }

    debug('authorize "%s" "%s" with instance', act, sub);
    return decision(ability.can(act, subject(sub, instance)));
  }
}

function decision(allowed: boolean) {
  return allowed ? AuthorizationDecision.ALLOW : AuthorizationDecision.ABSTAIN;
}
