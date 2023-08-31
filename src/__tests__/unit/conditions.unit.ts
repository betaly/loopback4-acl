import {defineAbility} from '@casl/ability';

import {Conditions} from '../../conditions';

describe('Conditions', () => {
  describe('toSql()', () => {
    it('translates conditions to parametrized sql', () => {
      const ability = defineAbility(can => {
        can('update', 'Post', {userId: 'userId'});
      });
      const conditionsProxy = new Conditions(ability, 'update', 'Post');
      expect(conditionsProxy.toSql()).toEqual(['"userId" = $1', ['userId'], []]);
    });

    it('negates cannot rule with not', () => {
      const ability = defineAbility((can, cannot) => {
        can('update', 'Movie');
        cannot('update', 'Movie', {status: 'PUBLISHED'});
      });
      const conditionsProxy = new Conditions(ability, 'update', 'Movie');
      expect(conditionsProxy.toSql()).toEqual(['not ("status" = $1)', ['PUBLISHED'], []]);
    });

    it('compose can rules', () => {
      const ability = defineAbility(can => {
        can('read', 'Upload', {public: true});
        can('read', 'Upload', {user: 'userId', public: false});
      });
      const conditionsProxy = new Conditions(ability, 'read', 'Upload');
      expect(conditionsProxy.toSql()).toEqual([
        '(("user" = $1 and "public" = $2) or "public" = $3)',
        ['userId', false, true],
        [],
      ]);
    });

    it('return undefined when no rules found', () => {
      const ability = defineAbility(can => {
        can('read', 'Upload', {public: true});
      });
      const conditionsProxy = new Conditions(ability, 'write', 'Upload');
      expect(conditionsProxy.toSql()).toBeUndefined();
    });

    it('return undefined for rule without conditions', () => {
      const ability = defineAbility(can => {
        can('read', 'Upload');
      });
      const conditionsProxy = new Conditions(ability, 'read', 'Upload');
      expect(conditionsProxy.toSql()).toBeUndefined();
    });
  });

  describe('toMongo()', () => {
    it('translates conditions to mongo query', () => {
      const ability = defineAbility(can => {
        can('update', 'Post', {userId: 'userId'});
      });
      const conditionsProxy = new Conditions(ability, 'update', 'Post');
      expect(conditionsProxy.toMongo()).toEqual({
        $or: [
          {
            userId: 'userId',
          },
        ],
      });
    });

    it('negates cannot rule with not', () => {
      const ability = defineAbility((can, cannot) => {
        can('update', 'Movie');
        cannot('update', 'Movie', {status: 'PUBLISHED'});
      });
      const conditionsProxy = new Conditions(ability, 'update', 'Movie');
      expect(conditionsProxy.toMongo()).toEqual({$and: [{$nor: [{status: 'PUBLISHED'}]}]});
    });

    it('compose can rules', () => {
      const ability = defineAbility(can => {
        can('read', 'Upload', {public: true});
        can('read', 'Upload', {user: 'userId', public: false});
      });
      const conditionsProxy = new Conditions(ability, 'read', 'Upload');
      expect(conditionsProxy.toMongo()).toEqual({$or: [{public: false, user: 'userId'}, {public: true}]});
    });

    it('return undefined when no rules found', () => {
      const ability = defineAbility(can => {
        can('read', 'Upload', {public: true});
      });
      const conditionsProxy = new Conditions(ability, 'write', 'Upload');
      expect(conditionsProxy.toMongo()).toBeUndefined();
    });

    it('return undefined for rule without conditions', () => {
      const ability = defineAbility(can => {
        can('read', 'Upload');
      });
      const conditionsProxy = new Conditions(ability, 'read', 'Upload');
      expect(conditionsProxy.toSql()).toBeUndefined();
    });
  });

  describe('get()', () => {
    it('returns array of conditions', () => {
      const ability = defineAbility(can => {
        can('read', 'Upload', {userId: {$in: ['1', '2']}});
        can('read', 'Upload', {userId: {$not: null}});
      });
      const conditionsProxy = new Conditions(ability, 'read', 'Upload');
      expect(conditionsProxy.get()).toEqual([{userId: {$not: null}}, {userId: {$in: ['1', '2']}}]);
    });
  });
});
