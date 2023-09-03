import {BindingAddress, BindingSelector, Context, InjectionMetadata, InvocationContext} from '@loopback/context';
import {inject, Injection, ResolutionSession} from '@loopback/core';

import {AclBindings, AclTags} from '../keys';
import {sureRunSubjectHooks} from '../subjects';
import {isBindingAddress} from '../utils';
import {authorise as authorise_} from './authorise';

export namespace acl {
  export const authorise = authorise_;

  /**
   * Injects the able object from the current authorization flow.
   */
  export const able = function injectAble() {
    return inject(AclBindings.ABLE, {decorator: '@acl.able'});
  };

  /**
   * Injects the subject object with bindingAddress from the subject resolver. undefined if no subject resolver is provided.
   *
   * @param bindingAddress
   * @param metadata
   */
  export function subject(bindingAddress: BindingAddress, metadata?: InjectionMetadata): ParameterDecorator;
  /**
   * Injects the subject object from the subject resolver. undefined if no subject resolver is provided.
   *
   * @param metadata
   */
  export function subject(metadata?: InjectionMetadata): ParameterDecorator;
  export function subject(
    bindingAddressOrMetadata?: BindingAddress | InjectionMetadata,
    metadata?: InjectionMetadata,
  ): ParameterDecorator {
    let bindingAddress: BindingSelector;
    if (!isBindingAddress(bindingAddressOrMetadata)) {
      bindingAddress = AclBindings.SUBJECT;
      metadata = bindingAddressOrMetadata;
    } else {
      bindingAddress = bindingAddressOrMetadata;
    }
    return inject(
      bindingAddress,
      {decorator: '@acl.subject', ...metadata},
      async (ctx: Context, injection: Readonly<Injection>, session: ResolutionSession) => {
        await sureRunSubjectHooks(ctx as InvocationContext);
        const key = session.currentBinding?.key ?? AclBindings.SUBJECT;

        const tagNames = ctx.getBinding(key, {optional: true})?.tagNames;
        if (tagNames && !tagNames?.includes(AclTags.SUBJECT)) {
          throw new Error(`"${key}" is not a subject binding`);
        }

        return ctx.get(key, injection.metadata);
      },
    ) as ParameterDecorator;
  }

  /**
   * Injects the conditions object from the current authorization flow.
   *
   * The value could be undefined if the conditions object is not available (e.g superuser authorizing).
   */
  export const conditions = function injectConditions() {
    return inject(AclBindings.CONDITIONS, {decorator: '@acl.conditions', optional: true});
  };
}
