import assert from 'assert';
import { isMatched } from '../src/lib/tagMatcher';
import tagMatcherTestCases from './tagMatcher';

describe('tagMatcher', function() {
  tagMatcherTestCases.forEach((tc, i) => {
    it(`rule #${i + 1} ${tc.rule}`, function() {
      assert.deepEqual(tc.problem.map(tagstr => isMatched(tc.rule, tagstr)), tc.answer);
    });
  });
});
