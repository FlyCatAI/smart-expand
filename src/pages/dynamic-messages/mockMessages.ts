import type {
  DynamicMessage,
  MessageTab,
  MessageTabId,
  MessageType,
  NoticeDetail,
} from './types';

const MOCK_LATENCY_MS = 80;

const tabNames: Record<MessageTabId, string> = {
  all: '全部',
  policy: '政策',
  training: '培训',
  notice: '通知',
  opportunity: '商机',
};

const messageTypeByTab: Partial<Record<MessageTabId, MessageType[]>> = {
  policy: ['政策通知'],
  training: ['培训通知'],
  notice: ['通知公告'],
  opportunity: ['商机推送'],
};

export type MessageMockScenario = 'default' | 'empty' | 'single' | 'fifty';

const approvedPolicyNoticeContent = `<section>
  <h2>客户信息与展业记录填写规范更新</h2>
  <p>为提升客户服务记录完整性，自 2026-06-01 起，展业人员在录入客户资料、跟进记录、需求标签时，应按页面字段逐项填写，不得使用与实际沟通不一致的描述。</p>
  <p>涉及保险产品介绍、保障责任、除外责任、缴费方式、犹豫期、退保规则等内容时，应以保险条款、产品说明书及承保保险公司正式材料为准。</p>
  <ul>
    <li>不得将保险产品表述为理财、储蓄或存款。</li>
    <li>不得承诺收益、承诺赔付结果或使用同业贬损表述。</li>
    <li>客户提出投保意向前，应提示其阅读保险条款、费率说明、健康告知及相关风险提示。</li>
  </ul>
  <p>本通知为内部展业流程提示，不构成保险产品宣传材料。</p>
</section>`;

const approvedTrainingNoticeContent = `<section>
  <h2>合规展业基础培训通知</h2>
  <p>本次培训面向使用慧展业进行客户跟进、商机管理、消息处理的展业人员，内容包括客户沟通记录规范、保险产品信息展示边界、如实告知提示及常见不合规表述识别。</p>
  <p>参训人员应在培训前准备本人账号，培训过程中按讲师要求完成签到、互动确认和课后测验。</p>
  <ul>
    <li>培训资料仅供内部学习使用，不得转发给客户或作为对外宣传材料。</li>
    <li>涉及具体保险产品的页面、条款、费率和承保公司信息，以系统内正式上架内容为准。</li>
    <li>课后测验结果用于内部学习记录，不作为客户服务承诺。</li>
  </ul>
</section>`;

const approvedTrainingAttentionNotes = `<section>
  <h3>注意事项</h3>
  <ul>
    <li>请使用本人账号参加培训并完成签到。</li>
    <li>请勿在培训群、客户群或个人社交平台发布未经审核的产品宣传内容。</li>
    <li>如对产品条款、风险提示、承保公司展示存在疑问，请先提交合规复核后再对外使用。</li>
  </ul>
</section>`;

const approvedAssessmentNoticeContent = `<section>
  <h2>展业记录规范性抽查公告</h2>
  <p>平台将于 2026-06-10 对部分展业记录进行规范性抽查，抽查范围包括客户跟进记录、商机处理状态、保险产品沟通备注及附件材料。</p>
  <p>抽查重点为信息填写完整性、客户沟通记录一致性、产品性质表述准确性、风险提示留痕完整性。</p>
  <ul>
    <li>不得补录与实际沟通不一致的内容。</li>
    <li>不得删除应保留的客户确认、风险提示、如实告知相关记录。</li>
    <li>如发现记录缺失，应按内部流程说明原因并补充客观材料。</li>
  </ul>
  <p>本公告用于内部流程管理，不代表对任何保险产品或服务结果作出承诺。</p>
</section>`;

const approvedDutyNoticeContent = `<section>
  <h2>端午假期客户服务值班安排</h2>
  <p>2026-06-19 至 2026-06-21 期间，平台安排客户服务与展业支持值班，处理账号登录、资料提交、保单信息查看、消息通知异常等问题。</p>
  <p>涉及投保、保全、理赔、退保等保险业务事项时，应引导客户通过承保保险公司公布的正式渠道办理，并保留沟通记录。</p>
  <ul>
    <li>值班人员不得代替客户作出投保、退保或健康告知决定。</li>
    <li>不得向客户承诺理赔结论、到账时间或退保金额。</li>
    <li>遇到投诉、纠纷、监管咨询等事项，应按升级流程转交专岗处理。</li>
  </ul>
  <p>本公告为内部值班安排说明，不作为对外服务时效承诺。</p>
</section>`;

const seedMessages: DynamicMessage[] = [
  {
    msg_id: 'msg-opportunity-001',
    msg_date: '2026-04-27',
    msg_time: '10:30',
    msg_type: '商机推送',
    msg_title: '测试商户A',
    msg_handler: '张经理',
    msg_summary: '客户首期跟进事项已生成，请根据业务流程继续处理。',
    merchant_id: 'merchant-test-001',
  },
  {
    msg_id: 'msg-policy-001',
    msg_date: '2026-04-26',
    msg_time: '09:00',
    msg_type: '政策通知',
    msg_title: '收单政策更新通知',
    msg_handler: '运营中心',
    msg_summary: '政策通知已发布，请按内部流程查看详情。',
    notice_id: 'notice-policy-001',
  },
  {
    msg_id: 'msg-training-001',
    msg_date: '2026-04-25',
    msg_time: '14:00',
    msg_type: '培训通知',
    msg_title: '支付系统操作培训',
    msg_handler: '培训中心',
    msg_summary: '培训通知已发布，请按内部流程查看详情。',
    notice_id: 'notice-training-001',
  },
  {
    msg_id: 'msg-merchant-001',
    msg_date: '2026-04-24',
    msg_time: '16:20',
    msg_type: '商户动态',
    msg_title: '测试商户B',
    msg_handler: '张经理',
    msg_summary: '商户结算信息跟进记录已更新。',
    merchant_id: 'merchant-test-002',
  },
  {
    msg_id: 'msg-notice-assessment-001',
    msg_date: '2026-04-24',
    msg_time: '11:00',
    msg_type: '通知公告',
    msg_title: '季度考核说明会通知',
    msg_handler: '综合管理部',
    msg_summary: '考核类公告已发布，请按内部流程查看详情。',
    notice_id: 'notice-assessment-001',
  },
  {
    msg_id: 'msg-business-001',
    msg_date: '2026-04-23',
    msg_time: '09:15',
    msg_type: '业务动态',
    msg_title: '测试商户C',
    msg_handler: '张经理',
    msg_summary: '商户业务状态已更新，请进入商户详情核对。',
    merchant_id: 'merchant-test-003',
  },
  {
    msg_id: 'msg-notice-duty-001',
    msg_date: '2026-04-22',
    msg_time: '17:30',
    msg_type: '通知公告',
    msg_title: '假期值班安排通知',
    msg_handler: '综合管理部',
    msg_summary: '值班类公告已发布，请按内部流程查看详情。',
    notice_id: 'notice-duty-001',
  },
];

const noticeDetails: NoticeDetail[] = [
  {
    notice_id: 'notice-policy-001',
    notice_title: '收单政策更新通知',
    notice_type: '政策通知',
    msg_date: '2026-04-26',
    valid_start: '2026-06-01',
    valid_end: '2026-06-30',
    notice_content: approvedPolicyNoticeContent,
    content_status: 'approved',
  },
  {
    notice_id: 'notice-training-001',
    notice_title: '支付系统操作培训',
    notice_type: '培训通知',
    msg_date: '2026-04-25',
    training_time: '2026-05-10 14:00',
    training_method: '线上',
    notice_content: approvedTrainingNoticeContent,
    attention_notes: approvedTrainingAttentionNotes,
    content_status: 'approved',
  },
  {
    notice_id: 'notice-assessment-001',
    notice_title: '季度考核说明会通知',
    notice_type: '通知公告',
    msg_date: '2026-04-24',
    announcement_kind: 'assessment',
    notice_content: approvedAssessmentNoticeContent,
    content_status: 'approved',
  },
  {
    notice_id: 'notice-duty-001',
    notice_title: '假期值班安排通知',
    notice_type: '通知公告',
    msg_date: '2026-04-22',
    announcement_kind: 'duty',
    holiday_start: '2026-06-19',
    holiday_end: '2026-06-21',
    notice_content: approvedDutyNoticeContent,
    content_status: 'approved',
  },
];

function waitForMockLatency() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, MOCK_LATENCY_MS);
  });
}

function cloneMessages() {
  return seedMessages.map((message) => ({ ...message }));
}

function messageForScenario(tabId: MessageTabId, index: number): DynamicMessage {
  const source = tabId === 'all'
    ? seedMessages[index % seedMessages.length]
    : seedMessages.find((message) => categoryForMessage(message) === tabId) || seedMessages[0];

  return {
    ...source,
    msg_id: `${source.msg_id}-scenario-${index + 1}`,
    msg_date: `2026-04-${String(27 - (index % 20)).padStart(2, '0')}`,
    msg_time: `${String(9 + (index % 8)).padStart(2, '0')}:${index % 2 === 0 ? '00' : '30'}`,
    msg_title: `${source.msg_title}-${index + 1}`,
  };
}

function buildScenarioMessages(scenario: MessageMockScenario, tabId: MessageTabId) {
  if (scenario === 'empty') return [];
  if (scenario === 'single') return [messageForScenario(tabId, 0)];
  if (scenario === 'fifty') {
    return Array.from({ length: 50 }, (_, index) => messageForScenario(tabId, index));
  }
  return cloneMessages();
}

function cloneNotice(detail: NoticeDetail): NoticeDetail {
  return { ...detail };
}

export function categoryForMessage(message: DynamicMessage): MessageTabId | 'merchant' | 'business' {
  if (message.msg_type === '政策通知') return 'policy';
  if (message.msg_type === '培训通知') return 'training';
  if (message.msg_type === '通知公告') return 'notice';
  if (message.msg_type === '商机推送') return 'opportunity';
  if (message.msg_type === '商户动态') return 'merchant';
  return 'business';
}

export function buildMessageTabs(messages: DynamicMessage[]): MessageTab[] {
  return (Object.keys(tabNames) as MessageTabId[]).map((tab_id) => {
    const types = messageTypeByTab[tab_id];
    return {
      tab_id,
      tab_name: tabNames[tab_id],
      badge_count: tab_id === 'all'
        ? messages.length
        : messages.filter((message) => types?.includes(message.msg_type)).length,
    };
  });
}

export async function fetchMockMessages(options: { scenario?: MessageMockScenario; tabId?: MessageTabId } = {}) {
  await waitForMockLatency();
  return buildScenarioMessages(options.scenario || 'default', options.tabId || 'all');
}

export async function fetchMockNoticeDetail(noticeId: string) {
  await waitForMockLatency();
  const detail = noticeDetails.find((item) => item.notice_id === noticeId);
  if (!detail) throw new Error('notice_not_found');
  return cloneNotice(detail);
}
