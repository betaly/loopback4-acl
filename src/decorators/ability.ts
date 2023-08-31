import {authorize} from '@loopback/authorization';

import {authorizerForSubjectResolvers} from '../subjects';
import {AnyClass, AnyObject, SubjectResolver} from '../types';

export type ClassOrMethodDecorator = MethodDecorator & ClassDecorator;

export interface AbilityOptions<Subject = AnyObject> {
  action: string;
  subject: string | AnyClass<Subject>;
  subjectResolver?: SubjectResolver<Subject> | Record<string, SubjectResolver<Subject>>;
}

export function ability<Subject = AnyObject>(options: AbilityOptions<Subject>): ClassOrMethodDecorator;
export function ability<Subject = AnyObject>(
  action: string,
  subject: string | AnyClass<Subject>,
  subjectResolver?: SubjectResolver<Subject> | Record<string, SubjectResolver<Subject>>,
): ClassOrMethodDecorator;
export function ability<Subject = AnyObject>(
  optionsOrAction: AbilityOptions<Subject> | string,
  subject?: string | AnyClass<Subject>,
  subjectResolver?: SubjectResolver<Subject> | Record<string, SubjectResolver<Subject>>,
) {
  const options = (
    typeof optionsOrAction === 'string'
      ? {action: optionsOrAction, subject, subjectResolver: subjectResolver}
      : optionsOrAction
  ) as AbilityOptions<Subject>;

  // const sub = typeof options.subject === 'string' ? options.subject : options.subject.name;
  // const act = options.action;
  return authorize({
    resource: options.subject as string,
    scopes: [options.action],
    voters: options.subjectResolver ? [authorizerForSubjectResolvers(options.subjectResolver)] : [],
  });
}
