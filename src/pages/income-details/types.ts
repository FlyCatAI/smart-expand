export type IncomeType = '达标' | '有效';

export type QualifiedType = 'all' | 'qualified' | 'effective';

export interface IncomeRecord {
  recordId: string;
  recordDate: string;
  merchantName: string;
  incomeType: IncomeType;
  incomeAmount: number;
}

export interface IncomeFilters {
  startDate: string;
  endDate: string;
  qualifiedType: QualifiedType;
}

export interface IncomeLoadFailure {
  route: string;
  reason: string;
  at: number;
}
