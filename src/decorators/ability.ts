import {authorize} from '@loopback/authorization';

import {authorizerForSubjectResolvers} from '../subjects';
import {AnyClass, AnyObject, SubjectResolver} from '../types';

export type ClassOrMethodDecorator = MethodDecorator & ClassDecorator;

export interface AbilityRule<Subject = AnyObject> {
  action: string;
  subject: string | AnyClass<Subject>;
  subjectResolver?: SubjectResolver<Subject> | Record<string, SubjectResolver<Subject>>;
}

export function ability<Subject = AnyObject>(rule: AbilityRule<Subject>): ClassOrMethodDecorator;
export function ability<Subject = AnyObject>(
  action: string,
  subject: string | AnyClass<Subject>,
  subjectResolver?: SubjectResolver<Subject> | Record<string, SubjectResolver<Subject>>,
): ClassOrMethodDecorator;
export function ability<Subject = AnyObject>(
  ruleOrAction: AbilityRule<Subject> | string,
  subject?: string | AnyClass<Subject>,
  subjectResolver?: SubjectResolver<Subject> | Record<string, SubjectResolver<Subject>>,
) {
  const rule = (
    typeof ruleOrAction === 'string' ? {action: ruleOrAction, subject, subjectResolver: subjectResolver} : ruleOrAction
  ) as AbilityRule<Subject>;

  // const sub = typeof options.subject === 'string' ? options.subject : options.subject.name;
  // const act = options.action;
  return authorize({
    resource: rule.subject as string,
    scopes: [rule.action],
    voters: rule.subjectResolver ? [authorizerForSubjectResolvers(rule.subjectResolver)] : [],
  });
}
