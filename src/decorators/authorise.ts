import {authorize as lbAuthorize} from '@loopback/authorization';

import {authorizerForSubjectResolvers} from '../subjects';
import {AnyClass, AnyObject, SubjectResolver} from '../types';

type ClassOrMethodDecorator = MethodDecorator & ClassDecorator;

export interface AuthorisationRule<Subject = AnyObject> {
  action: string;
  subject: string | AnyClass<Subject>;
  subjectResolver?: SubjectResolver<Subject> | Record<string, SubjectResolver<Subject>>;
}

/**
 * Authorize a request using the given authorization rule
 * @param rule
 */
export function authorise<Subject = AnyObject>(rule: AuthorisationRule<Subject>): ClassOrMethodDecorator;
export function authorise<Subject = AnyObject>(
  action: string,
  subject: string | AnyClass<Subject>,
  subjectResolver?: SubjectResolver<Subject> | Record<string, SubjectResolver<Subject>>,
): ClassOrMethodDecorator;
export function authorise<Subject = AnyObject>(
  ruleOrAction: AuthorisationRule<Subject> | string,
  subject?: string | AnyClass<Subject>,
  subjectResolver?: SubjectResolver<Subject> | Record<string, SubjectResolver<Subject>>,
) {
  const rule = (
    typeof ruleOrAction === 'string' ? {action: ruleOrAction, subject, subjectResolver: subjectResolver} : ruleOrAction
  ) as AuthorisationRule<Subject>;

  // const sub = typeof options.subject === 'string' ? options.subject : options.subject.name;
  // const act = options.action;
  return lbAuthorize({
    resource: rule.subject as string,
    scopes: [rule.action],
    voters: rule.subjectResolver ? [authorizerForSubjectResolvers(rule.subjectResolver)] : [],
  });
}
