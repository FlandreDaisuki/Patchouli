import { $print } from './utils';

const DEFAULT_MATCH = true;

const isString = (s) => typeof(s) === 'string';
const isFunction = (s) => typeof(s) === 'function';
const isOrOp = (s) => s === ' || ';
const isAndOp = (s) => s === ' && ';
const isCondOp = (s) => isOrOp(s) || isAndOp(s);
const isGroupExpr = (s) => isString(s) && (/^{.*}$/).test(s);
const isPartialExclusionExpr = (s) => isString(s) && (/^-[^-].*$/).test(s);
const isPartialInclusionExpr = (s) => isString(s) && (/^[+]?.*$/).test(s);
const defaultFunc = () => DEFAULT_MATCH;

export const isMatched = (ruleStr, targetStr) => {

  const rule = ruleStr.toLowerCase();
  const target = targetStr.toLowerCase();

  return makeRuleFunc(rule, target)();
};

export const makeRuleFunc = (rule, target) => {
  if (isString(rule)) {
    // raw toks
    const rtoks = rule.trim().match(/(\{.*?\}| ([|]{2}|[&]{2}) |\S+)/g);
    if (!rtoks) {
      return defaultFunc;
    }

    const tokList = rtoks.map((rtok) => {
      if (isCondOp(rtok)) {
        return rtok;
      } else if (isGroupExpr(rtok)) {
        return makeRuleFunc(rtok.slice(1, -1), target);
      } else if (isPartialExclusionExpr(rtok)) {
        return () => !target.includes(rtok.slice(1));
      } else if (isPartialInclusionExpr(rtok)) {
        return () => target.includes(rtok.replace(/^[+]?(.*)$/, '$1'));
      } else {
        $print.log('tagMatcher#makeRuleFunc: Unknown rtok', rtok);
        return defaultFunc;
      }
    });

    return makeRuleFunc(tokList, target);
  } else {
    const ruleList = rule.map(r => (isString(r) && !isCondOp(r)) ? makeRuleFunc(r, target) : r);
    const funcList = ruleList.filter(isFunction);
    const opList = ruleList.filter(isCondOp);
    if (funcList.length + opList.length !== ruleList.length) {
      $print.log('tagMatcher#makeRuleFunc: Unknown ruleList', ruleList);
      return defaultFunc;
    }

    if (opList.every(isAndOp)) {
      // include opList.length === 0
      return () => funcList.every(fn => fn());
    } else if (opList.every(isOrOp)) {
      return () => funcList.some(fn => fn());
    } else {
      $print.log('tagMatcher#makeRuleFunc: Mixed condition operators without grouping', ruleList);
      return defaultFunc;
    }
  }
};

export default {
  isMatched,
  makeRuleFunc,
};
