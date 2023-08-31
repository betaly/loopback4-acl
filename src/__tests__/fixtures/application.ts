import '@bleco/boot';

import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';

import {CaslComponent} from '../../component';
import {CaslBindings} from '../../keys';
import {TodoComponent} from './components/todo/component';
import {UserComponent} from './components/user/component';

export class TestAuthorizationApplication extends BootMixin(RepositoryMixin(RestApplication)) {
  constructor(config: ApplicationConfig) {
    super(config);
    this.projectRoot = __dirname;
    this.bind(CaslBindings.CONFIG).to(config.casl);
    this.component(CaslComponent);
    this.component(UserComponent);
    this.component(TodoComponent);
  }

  async main() {
    await this.boot();
    await this.start();
  }
}
