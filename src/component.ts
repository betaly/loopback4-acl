import {
  AuthorizationBindings,
  AuthorizationComponent,
  AuthorizationDecision,
  AuthorizationOptions,
} from '@loopback/authorization';
import {Application, Component, CoreBindings, inject, ProviderMap, ServiceOrProviderClass} from '@loopback/core';
import {SecurityBindings} from '@loopback/security';

import {CaslAuthorizer} from './casl-authorizer';
import {AclBindings} from './keys';
import {AbilityService} from './services';
import {AclConfig, UserResolver} from './types';

export class AclComponent implements Component {
  /**
   * A map of providers to be bound to the application context
   */
  providers: ProviderMap;

  /**
   * An array of service or provider classes
   */
  services: ServiceOrProviderClass[];

  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    private readonly app: Application,
    @inject(AclBindings.CONFIG, {optional: true})
    private readonly config?: AclConfig,
  ) {
    const {superuserRole, userResolver} = this.config ?? {};

    if (!app.isBound(AclBindings.USER_RESOLVER)) {
      let userResolverFn: UserResolver;
      if (typeof userResolver === 'function') {
        userResolverFn = userResolver;
      } else {
        const userBindingAddress = userResolver ?? SecurityBindings.USER;
        userResolverFn = async ctx => ctx.get(userBindingAddress);
      }
      app.bind(AclBindings.USER_RESOLVER).to(userResolverFn);
    }

    if (!app.isBound(AclBindings.SUPERUSER_ROLE) && superuserRole) {
      app.bind(AclBindings.SUPERUSER_ROLE).to(superuserRole);
    }

    if (!app.isBound(`${CoreBindings.COMPONENTS}.${AuthorizationComponent.name}`)) {
      this.app.configure<AuthorizationOptions>(AuthorizationBindings.COMPONENT).to({
        defaultDecision: AuthorizationDecision.DENY,
      });
      this.app.component(AuthorizationComponent);
    }

    this.providers = {
      [AclBindings.AUTHORIZER.key]: CaslAuthorizer,
    };
    this.services = [AbilityService];
  }
}
