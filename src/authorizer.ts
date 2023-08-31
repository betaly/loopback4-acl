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

import {Actions} from './actions';
import {Conditions} from './conditions';
import {getPermissionsMetadata} from './decorators';
import {CaslBindings} from './keys';
import {AbilityService} from './services';
import {sureRunSubjectHooks} from './subjects';
import {UserResolver} from './types';

const debug = debugFactory('casl:authorizer');

@injectable({
  scope: BindingScope.SINGLETON,
  tags: [AuthorizationTags.AUTHORIZER],
})
export class CaslAuthorizer implements Provider<Authorizer> {
  constructor(
    @service(AbilityService)
    private abilityService: AbilityService,
    @inject(CaslBindings.USER_RESOLVER, {optional: true})
    private resolveUser: UserResolver,
    @inject.getter(CaslBindings.SUPERUSER_ROLE, {optional: true})
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
        'current user not found. maybe not logged in or forgot to alias real user biding key to CaslBindings.CURRENT_USER in CaslComponent initialization',
      );
      return AuthorizationDecision.ABSTAIN;
    }

    const {roles} = user ?? [];

    const superuserRole = await this.getSuperUserRole?.();
    if (superuserRole && roles.includes(superuserRole)) {
      debug('superuser access granted');
      return AuthorizationDecision.ALLOW;
    }

    const sub = metadata.resource ?? authorizationCtx.resource;
    const act = metadata.scopes?.[0] ?? Actions.execute;

    const permissions = getPermissionsMetadata(invocationContext.target, invocationContext.methodName);
    const abilities = await this.abilityService.buildForUser(user, {permissions});
    const rules = abilities.rulesFor(act, sub);

    debug('Binding CaslBindings.CONDITIONS to rules for %s %s: %o', act, sub, rules);
    invocationContext.bind(CaslBindings.CONDITIONS).to(new Conditions(abilities, act, sub));

    if (!rules.every(rule => rule.conditions) || !invocationContext.isBound(CaslBindings.Auth.SUBJECT_HOOKS)) {
      debug('authorize "%s" "%s" with class or type', act, sub);
      return decision(abilities.can(act, sub));
    }

    await sureRunSubjectHooks(invocationContext);

    const instance = await invocationContext.get(CaslBindings.SUBJECT, {optional: true});

    if (!instance) {
      debug('authorize "%s" "%s" with class or type', act, sub);
      return decision(abilities.can(act, sub));
    }

    debug('authorize "%s" "%s" with instance', act, sub);
    return decision(abilities.can(act, subject(sub, instance)));
  }
}

function decision(allowed: boolean) {
  return allowed ? AuthorizationDecision.ALLOW : AuthorizationDecision.ABSTAIN;
}
