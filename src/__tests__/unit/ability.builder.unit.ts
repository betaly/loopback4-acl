import {nullConditionsMatcher} from '../../ability-builder';

describe('ability-builder', () => {
  it('null conditions matcher always true', () => {
    expect(nullConditionsMatcher()()).toBeTruthy();
  });
});
