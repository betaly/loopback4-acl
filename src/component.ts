import {
  AuthorizationBindings,
  AuthorizationComponent,
  AuthorizationDecision,
  AuthorizationOptions,
} from '@loopback/authorization';
import {Application, Component, CoreBindings, inject, ProviderMap, ServiceOrProviderClass} from '@loopback/core';
import {SecurityBindings} from '@loopback/security';

import {CaslAuthorizer} from './authorizer';
import {CaslBindings} from './keys';
import {AbilityService} from './services';
import {CaslConfig, UserResolver} from './types';

export class CaslComponent implements Component {
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
    @inject(CaslBindings.CONFIG, {optional: true})
    private readonly config?: CaslConfig,
  ) {
    const {superuserRole, userResolver} = this.config ?? {};

    if (!app.isBound(CaslBindings.USER_RESOLVER)) {
      let userResolverFn: UserResolver;
      if (typeof userResolver === 'function') {
        userResolverFn = userResolver;
      } else {
        const userBindingAddress = userResolver ?? SecurityBindings.USER;
        userResolverFn = async ctx => ctx.get(userBindingAddress);
      }
      app.bind(CaslBindings.USER_RESOLVER).to(userResolverFn);
    }

    if (!app.isBound(CaslBindings.SUPERUSER_ROLE) && superuserRole) {
      app.bind(CaslBindings.SUPERUSER_ROLE).to(superuserRole);
    }

    if (!app.isBound(`${CoreBindings.COMPONENTS}.${AuthorizationComponent.name}`)) {
      this.app.configure<AuthorizationOptions>(AuthorizationBindings.COMPONENT).to({
        defaultDecision: AuthorizationDecision.DENY,
      });
      this.app.component(AuthorizationComponent);
    }

    this.providers = {
      [CaslBindings.AUTHORIZER.key]: CaslAuthorizer,
    };
    this.services = [AbilityService];
  }
}
