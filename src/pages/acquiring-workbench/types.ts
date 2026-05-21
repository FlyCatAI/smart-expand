export type KpiTone = 'positive' | 'negative' | 'neutral';

export interface KpiCard {
  id: 'income' | 'entry' | 'qualified' | 'active';
  label: string;
  value: string;
  delta: string;
  deltaTone: KpiTone;
  route: string;
}

export interface RawKpi {
  incomeAmount: number | null;
  incomeDelta: number | null;
  entryCount: number;
  entryDelta: number;
  qualifiedCount: number;
  qualifiedDelta: number;
  activeCount: number;
  activeDelta: number;
  activeThreshold: number;
}

export type NotificationType = '网点动态' | '系统通知' | '活动公告';

export interface WorkbenchNotification {
  id: string;
  type: NotificationType;
  title: string;
  url: string;
}

export type QuickActionId =
  | 'new_entry'
  | 'merchant_dedup'
  | 'ranking'
  | 'first_followup'
  | 'potential_active'
  | 'high_subsidy_visit'
  | 'query'
  | 'opportunity'
  | 'subsidy'
  | 'transaction'
  | 'filter_advanced';

export type QuickActionKind = 'toast' | 'filter_list' | 'expand_input' | 'sort_list' | 'modal';

export interface QuickAction {
  id: QuickActionId;
  name: string;
  action: QuickActionKind;
}

export type MerchantAdmissionStatus = '准入成功' | '准入失败' | '已补贴' | '无补贴';
export type MerchantProgress = '已达标' | '已有效' | '未达标' | '未有效';
export type MerchantType = '正餐餐饮' | '饮品甜点' | '商超购物' | '社区便利' | '美容美发' | '医疗保健';
export type MerchantExpandType = '自拓' | '合作推荐';
export type AumLevel = 'AUM未达1万' | 'AUM1-10万' | 'AUM10-100万' | 'AUM100万以上' | 'AUM暂无数据';
export type MarketingTag = '首期二访' | '二访' | '高补贴' | '高补贴回访' | '潜力有效';

export interface RegionValue {
  province: string;
  city: string;
  district: string;
  branch: string;
}

export interface Merchant {
  merchantId: string;
  merchantName: string;
  managerName: string;
  expandType: MerchantExpandType;
  entryDate: string;
  distanceKm: number;
  admissionStatus: MerchantAdmissionStatus;
  progress: MerchantProgress;
  merchantType: MerchantType;
  aumLevel: AumLevel;
  aumBoundary: string;
  marketingTags: MarketingTag[];
  partnerOrg: string;
  opportunityTime: string;
  subsidyAmount: number;
  transactionAmount: number;
  region: RegionValue;
}

export interface WorkbenchFilters {
  admissionStatuses: MerchantAdmissionStatus[];
  merchantTypes: MerchantType[];
  progresses: MerchantProgress[];
  partner: '全部' | '是' | '否';
  entryStart: string;
  entryEnd: string;
  region: RegionValue;
}

export type SortMode = '' | 'opportunity' | 'subsidy' | 'transaction';

export interface RouteFailure {
  route: string;
  reason: string;
  at: number;
}
