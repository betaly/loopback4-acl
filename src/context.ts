import {InvocationContext} from '@loopback/context';
import {Request, ResolvedRoute, RestBindings} from '@loopback/rest';

import {AclBindings} from './keys';
import {IAuthUserWithRoles, UserResolver} from './types';

export class AuthContext<User extends IAuthUserWithRoles = IAuthUserWithRoles> {
  private _request: Request;
  private _params: Record<string, string>;

  private constructor(readonly invocationContext: InvocationContext, readonly user?: User) {}

  static async create<User extends IAuthUserWithRoles = IAuthUserWithRoles>(invocationContext: InvocationContext) {
    const resolveUser = invocationContext.getSync<UserResolver<User>>(AclBindings.USER_RESOLVER);
    const user = await resolveUser(invocationContext);
    return new AuthContext(invocationContext, user);
  }

  get request() {
    if (!this._request) {
      this._request = this.invocationContext.getSync<Request>(RestBindings.Http.REQUEST);
    }
    return this._request;
  }

  get args() {
    return this.invocationContext.args;
  }

  get params() {
    if (!this._params) {
      const route = this.invocationContext.source?.value as ResolvedRoute;
      this._params = {
        ...route?.pathParams,
        ...this.request.params,
        ...this.request.query,
      };
    }
    return this._params;
  }

  get body() {
    return this.request.body;
  }
}
