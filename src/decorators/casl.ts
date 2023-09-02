import {BindingAddress, BindingSelector, Context, InjectionMetadata, InvocationContext} from '@loopback/context';
import {inject, Injection, ResolutionSession} from '@loopback/core';

import {CaslBindings, CaslTags} from '../keys';
import {sureRunSubjectHooks} from '../subjects';
import {isBindingAddress} from '../utils';

export namespace casl {
  /**
   * Injects the conditions object from the current authorization flow.
   *
   * The value could be undefined if the conditions object is not available (e.g superuser authorizing).
   */
  export const conditions = function injectConditions() {
    return inject(CaslBindings.CONDITIONS, {decorator: '@casl.conditions', optional: true});
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
      bindingAddress = CaslBindings.SUBJECT;
      metadata = bindingAddressOrMetadata;
    } else {
      bindingAddress = bindingAddressOrMetadata;
    }
    return inject(
      bindingAddress,
      {decorator: '@casl.subject', ...metadata},
      async (ctx: Context, injection: Readonly<Injection>, session: ResolutionSession) => {
        await sureRunSubjectHooks(ctx as InvocationContext);
        const key = session.currentBinding?.key ?? CaslBindings.SUBJECT;

        const tagNames = ctx.getBinding(key, {optional: true})?.tagNames;
        if (tagNames && !tagNames?.includes(CaslTags.SUBJECT)) {
          throw new Error(`"${key}" is not a subject binding`);
        }

        return ctx.get(key, injection.metadata);
      },
    ) as ParameterDecorator;
  }
}
