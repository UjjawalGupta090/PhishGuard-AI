import { IndicatorCategory, IndicatorNature, IndicatorSeverity } from '../../types/contract.js';

export interface RuleMatch {
  id: string;
  category: IndicatorCategory;
  severity: IndicatorSeverity;
  weight: number; // 0.0 to 1.0
  start: number;
  end: number;
  matchedText: string;
  reason: string;
  nature?: IndicatorNature;
}

export interface RulePattern {
  id: string;
  category: IndicatorCategory;
  severity: IndicatorSeverity;
  weight: number;
  pattern: RegExp | string;
  reason: string;
  isWordBoundary?: boolean;
}
