export const merchantDetailFixtures = {
  'merchant-with-product': {
    merchant_id: 'merchant-with-product',
    merchant_name: '测试商户一',
    contact_name: '测试联系人',
    contact_phone: '138****0000',
    merchant_no: 'M2024010104',
    account_no: '622202********0126',
    address: '上海市黄浦区测试路100号',
    merchant_nature: '个体',
    pay_org: '银联商务',
    entry_time: '2024-01-04',
    qualified_time: '2024-02-15',
    status: '已有效',
    aum_level: 'AUM1-10万',
    has_product: true,
    product_summary: {
      title: '已配置产品',
      items: ['收单服务', '活期账户', '普惠贷款']
    },
    operation_assets: {
      subsidy_current: 1.2,
      subsidy_estimate: 1.5,
      monthly_settlement: Number.NaN,
      current_balance: 7.5,
      monthly_avg_balance: 11.7,
      current_fin_assets: 15,
      monthly_avg_fin_assets: 18,
      loan_limit: 4.5,
      eloan_limit: 2.25,
      credit_card_limit: 3.75
    },
    competitor_transfers: [
      { competitor_bank: '中国工商银行', competitor_amount: -1.5 },
      { competitor_bank: '中国建设银行', competitor_amount: -0.85 },
      { competitor_bank: '招商银行', competitor_amount: -1.2 }
    ],
    opportunities: [
      {
        opportunity_id: 'opp-001',
        opportunity_type: '首期二访',
        opportunity_desc: '营销活动未达标，请提升',
        opportunity_pub_date: '2026-04-20'
      },
      {
        opportunity_id: 'opp-002',
        opportunity_type: '提额机会',
        opportunity_desc: '客户资质良好，建议提额',
        opportunity_pub_date: '2026-04-22'
      }
    ]
  },
  'merchant-no-product': {
    merchant_id: 'merchant-no-product',
    merchant_name: '测试商户二',
    contact_name: '测试联系人',
    contact_phone: '138****0000',
    merchant_no: 'M2024010205',
    account_no: '622202********0205',
    address: '上海市浦东新区测试路200号',
    merchant_nature: '企业',
    pay_org: '拉卡拉',
    entry_time: '2024-01-08',
    qualified_time: '',
    status: '未达标',
    aum_level: 'AUM100万以上',
    has_product: false,
    product_summary: {
      title: '暂无产品',
      items: []
    },
    operation_assets: {
      subsidy_current: 5.44,
      subsidy_estimate: 6.8,
      monthly_settlement: 0,
      current_balance: 34,
      monthly_avg_balance: 35.75,
      current_fin_assets: 68,
      monthly_avg_fin_assets: 55,
      loan_limit: 0,
      eloan_limit: 0,
      credit_card_limit: 0
    },
    competitor_transfers: [
      { competitor_bank: '中国工商银行', competitor_amount: -1.5 },
      { competitor_bank: '中国建设银行', competitor_amount: -0.85 },
      { competitor_bank: '招商银行', competitor_amount: -1.2 }
    ],
    opportunities: [
      {
        opportunity_id: 'opp-003',
        opportunity_type: '新客优惠',
        opportunity_desc: '新入网商户，推荐产品',
        opportunity_pub_date: '2026-04-23'
      }
    ]
  }
}

export const merchantDynamicFixtures = {
  'merchant-with-product': Array.from({ length: 36 }, (_, index) => ({
    record_id: `with-product-record-${index + 1}`,
    record_date: `2026-04-${String(28 - (index % 20)).padStart(2, '0')} ${String(9 + (index % 8)).padStart(2, '0')}:30`,
    handler_name: '测试经理',
    record_content: `第${index + 1}次测试回访记录，已按 mock 数据记录沟通摘要。`
  })),
  'merchant-no-product': Array.from({ length: 7 }, (_, index) => ({
    record_id: `no-product-record-${index + 1}`,
    record_date: `2026-04-${String(18 - index).padStart(2, '0')} 10:00`,
    handler_name: '测试经理',
    record_content: `第${index + 1}次测试回访记录，商户当前为无产品状态。`
  }))
}

export const DEFAULT_MERCHANT_ID = 'merchant-with-product'
