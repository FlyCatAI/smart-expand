import type {
  AumLevel,
  MarketingTag,
  Merchant,
  MerchantAdmissionStatus,
  MerchantProgress,
  MerchantType,
  RegionValue,
} from './types';

const merchantTypes: MerchantType[] = ['正餐餐饮', '饮品甜点', '商超购物', '社区便利', '美容美发', '医疗保健'];
const admissionStatuses: MerchantAdmissionStatus[] = ['准入成功', '准入失败', '已补贴', '无补贴'];
const progresses: MerchantProgress[] = ['已达标', '已有效', '未达标', '未有效'];
const tagGroups: MarketingTag[][] = [
  ['首期二访'],
  ['二访'],
  ['高补贴'],
  ['潜力有效'],
  ['首期二访', '潜力有效'],
  ['高补贴', '二访'],
  [],
];
const aumLevels: Array<{ level: AumLevel; boundary: string }> = [
  { level: 'AUM未达1万', boundary: 'AUM < 1万' },
  { level: 'AUM1-10万', boundary: '1万 ≤ AUM < 10万' },
  { level: 'AUM10-100万', boundary: '10万 ≤ AUM < 100万' },
  { level: 'AUM100万以上', boundary: 'AUM ≥ 100万' },
  { level: 'AUM暂无数据', boundary: '无数据' },
];
const regions: RegionValue[] = [
  { province: '广东省', city: '广州市', district: '天河区', branch: '天河网点' },
  { province: '广东省', city: '深圳市', district: '南山区', branch: '南山网点' },
  { province: '浙江省', city: '杭州市', district: '西湖区', branch: '西湖网点' },
  { province: '江苏省', city: '南京市', district: '鼓楼区', branch: '鼓楼网点' },
];

function formatDate(offset: number) {
  const date = new Date(Date.UTC(2026, 3, 27 - offset));
  return date.toISOString().slice(0, 10);
}

export async function fetchMockMerchants(): Promise<Merchant[]> {
  await new Promise((resolve) => window.setTimeout(resolve, 120));

  return Array.from({ length: 48 }, (_, index) => {
    const number = index + 1;
    const aum = aumLevels[index % aumLevels.length];
    const region = regions[index % regions.length];

    return {
      merchantId: `MOCK-M${String(number).padStart(4, '0')}`,
      merchantName: `测试商户${String(number).padStart(2, '0')}`,
      managerName: '测试客户经理',
      expandType: index % 3 === 0 ? '合作推荐' : '自拓',
      entryDate: formatDate(index),
      distanceKm: Number(((index % 12) * 0.7 + 0.8).toFixed(1)),
      admissionStatus: admissionStatuses[index % admissionStatuses.length],
      progress: progresses[index % progresses.length],
      merchantType: merchantTypes[index % merchantTypes.length],
      aumLevel: aum.level,
      aumBoundary: aum.boundary,
      marketingTags: tagGroups[index % tagGroups.length],
      partnerOrg: index % 3 === 0 ? '测试合作机构合作推荐' : '',
      opportunityTime: formatDate(47 - index),
      subsidyAmount: Number(((index % 17) * 0.31).toFixed(2)),
      transactionAmount: Number((120 + (index % 19) * 18.6).toFixed(2)),
      region,
    };
  });
}
