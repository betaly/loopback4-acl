import {authorize as lbAuthorize} from '@loopback/authorization';

import {authorizerForSubjectResolvers} from '../subjects';
import {AnyClass, AnyObject, IAuthUserWithRoles, SubjectResolver} from '../types';

type ClassOrMethodDecorator = MethodDecorator & ClassDecorator;

export interface AuthorisationRule<Subject = AnyObject, User extends IAuthUserWithRoles = IAuthUserWithRoles> {
  action: string;
  subject: string | AnyClass<Subject>;
  subjectResolver?: SubjectResolver<Subject, User> | Record<string, SubjectResolver<Subject, User>>;
}

/**
 * Authorize a request using the given authorization rule
 * @param rule
 */
export function authorise<Subject = AnyObject, User extends IAuthUserWithRoles = IAuthUserWithRoles>(
  rule: AuthorisationRule<Subject, User>,
): ClassOrMethodDecorator;
export function authorise<Subject = AnyObject, User extends IAuthUserWithRoles = IAuthUserWithRoles>(
  action: string,
  subject: string | AnyClass<Subject>,
  subjectResolver?: SubjectResolver<Subject, User> | Record<string, SubjectResolver<Subject, User>>,
): ClassOrMethodDecorator;
export function authorise<Subject = AnyObject, User extends IAuthUserWithRoles = IAuthUserWithRoles>(
  ruleOrAction: AuthorisationRule<Subject, User> | string,
  subject?: string | AnyClass<Subject>,
  subjectResolver?: SubjectResolver<Subject, User> | Record<string, SubjectResolver<Subject, User>>,
) {
  const rule = (
    typeof ruleOrAction === 'string' ? {action: ruleOrAction, subject, subjectResolver: subjectResolver} : ruleOrAction
  ) as AuthorisationRule<Subject, User>;

  // const sub = typeof options.subject === 'string' ? options.subject : options.subject.name;
  // const act = options.action;
  return lbAuthorize({
    resource: rule.subject as string,
    scopes: [rule.action],
    voters: rule.subjectResolver ? [authorizerForSubjectResolvers(rule.subjectResolver)] : [],
  });
}
