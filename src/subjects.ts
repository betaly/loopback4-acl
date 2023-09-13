import {AuthorizationDecision, Authorizer} from '@loopback/authorization';
import {BindingAddress, BindingScope, Context, InvocationContext, isProviderClass} from '@loopback/context';
import debugFactory from 'debug';
import {uid} from 'uid';

import {AuthContext} from './context';
import {AclBindings, AclTags} from './keys';
import {AnyClass, AnyObject, AuthHookFn, IAuthUserWithRoles, SubjectResolveFn, SubjectResolver} from './types';
import {isBindingAddress, isSubjectResolver} from './utils';

const debug = debugFactory('acl:subjects');

export function authorizerForSubjectResolvers<
  Subject = AnyObject,
  User extends IAuthUserWithRoles = IAuthUserWithRoles,
>(resolvers: SubjectResolver<Subject, User> | Record<string, SubjectResolver<Subject, User>>): Authorizer {
  const resolversToUse = (isSubjectResolver(resolvers) ? {[AclBindings.SUBJECT.key]: resolvers} : resolvers) as Record<
    string,
    SubjectResolver<Subject, User>
  >;

  return async ({invocationContext}) => {
    const hooks = sureSubjectHooks<User>(invocationContext);
    hooks.push(toAuthHooks(resolversToUse));
    return AuthorizationDecision.ABSTAIN;
  };
}

function toAuthHooks<Subject = AnyObject, User extends IAuthUserWithRoles = IAuthUserWithRoles>(
  resolvers: Record<string, SubjectResolver<Subject, User>>,
) {
  return async (ctx: AuthContext<User>) => {
    const {invocationContext} = ctx;

    for (const key of Object.keys(resolvers)) {
      const resolver = resolvers[key];

      let subject: Subject | undefined;
      if (Array.isArray(resolver)) {
        const [serviceTypeOrKey, resolve] = resolver;
        const service = await getService(invocationContext, serviceTypeOrKey);
        subject = await resolve(service, ctx);
      } else {
        let resolve: SubjectResolveFn<Subject, User>;
        if (isBindingAddress(resolver)) {
          resolve = await invocationContext.get<SubjectResolveFn<Subject>>(resolver);
        } else if (isProviderClass(resolver)) {
          const resolverKey = `subject.resolvers.${resolver.name}-${uid()}`;
          invocationContext.bind(resolverKey).toProvider(resolver).inScope(BindingScope.TRANSIENT);
          resolve = await invocationContext.get<SubjectResolveFn<Subject>>(resolverKey);
        } else {
          resolve = resolver;
        }
        subject = await resolve(ctx);
      }

      invocationContext
        .bind(key)
        .to(subject as Subject)
        .tag(AclTags.SUBJECT);

      // bind first subject to AclBindings.SUBJECT if not bound yet
      if (!invocationContext.contains(AclBindings.SUBJECT)) {
        invocationContext.bind(AclBindings.SUBJECT).toAlias(key);
      }
    }
  };
}

function sureSubjectHooks<User extends IAuthUserWithRoles = IAuthUserWithRoles>(context: Context) {
  if (!context.contains(AclBindings.Auth.SUBJECT_HOOKS)) {
    context.bind(AclBindings.Auth.SUBJECT_HOOKS).to([]);
  }
  return context.getSync<AuthHookFn<User>[]>(AclBindings.Auth.SUBJECT_HOOKS);
}

function possibleServiceKeys(serviceTypeOrKey: AnyClass) {
  const name = serviceTypeOrKey.name;
  return [name, `services.${name}`, `repositories.${name}`];
}

async function getService(context: Context, serviceTypeOrKey: AnyClass | BindingAddress<AnyClass>) {
  const service = await tryToResolveService(context, serviceTypeOrKey);
  if (!service) {
    if (isBindingAddress(serviceTypeOrKey)) {
      throw new Error(`Service ${serviceTypeOrKey} not found`);
    }
    throw new Error(`Service ${serviceTypeOrKey.name} [${possibleServiceKeys(serviceTypeOrKey).join(', ')}] not found`);
  }
  return service;
}

async function tryToResolveService(context: Context, serviceTypeOrKey: AnyClass | BindingAddress<AnyClass>) {
  let key;
  if (isBindingAddress(serviceTypeOrKey)) {
    key = context.isBound(serviceTypeOrKey) ? serviceTypeOrKey : '';
  } else {
    key = possibleServiceKeys(serviceTypeOrKey).find(k => context.isBound(k));
  }

  if (key) {
    return context.get(key);
  }
}

export async function sureRunSubjectHooks(invocationContext: InvocationContext) {
  debug('sure subject hooks has been run');
  if (!invocationContext.isBound(AclBindings.SUBJECT) && invocationContext.isBound(AclBindings.Auth.SUBJECT_HOOKS)) {
    // run subject hooks
    const hooks = await invocationContext.get(AclBindings.Auth.SUBJECT_HOOKS);
    if (!hooks?.length) {
      return;
    }
    debug(`run subject ${hooks.length} hooks`);
    const authCtx = await AuthContext.create(invocationContext);
    for (const hook of hooks) {
      await hook(authCtx);
    }
  }
}
