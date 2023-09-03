import '@bleco/boot';

import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';

import {AclComponent} from '../../component';
import {AclBindings} from '../../keys';
import {TodoComponent} from './components/todo/component';
import {UserComponent} from './components/user/component';

export class TestAuthorizationApplication extends BootMixin(RepositoryMixin(RestApplication)) {
  constructor(config: ApplicationConfig) {
    super(config);
    this.projectRoot = __dirname;
    this.bind(AclBindings.CONFIG).to(config.acl);
    this.component(AclComponent);
    this.component(UserComponent);
    this.component(TodoComponent);
  }

  async main() {
    await this.boot();
    await this.start();
  }
}
