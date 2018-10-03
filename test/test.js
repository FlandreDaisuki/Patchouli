import assert from 'assert';
import tagFilterQuerier from '../src/lib/tagFilterQuerier';
import tagMatcherTestCases from './tagFilterQueryTestCases';

describe('tagMatcher', function() {
  tagMatcherTestCases.forEach((tc, i) => {
    it(`rule #${i + 1} ${tc.rule}`, function() {
      assert.deepEqual(tc.problem.map(tagstr => tagFilterQuerier.isMatched(tc.rule, tagstr)), tc.answer);
    });
  });
});
