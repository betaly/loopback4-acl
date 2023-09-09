import {InvocationContext} from '@loopback/context';
import {Request, ResolvedRoute, RestBindings} from '@loopback/rest';

export class AuthContext {
  private _request: Request;
  private _params: Record<string, string>;

  constructor(readonly invocationContext: InvocationContext) {}

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
