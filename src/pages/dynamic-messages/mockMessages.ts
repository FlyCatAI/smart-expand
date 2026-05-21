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
    msg_summary: '政策通知已发布，正文待合规确认后展示。',
    notice_id: 'notice-policy-001',
  },
  {
    msg_id: 'msg-training-001',
    msg_date: '2026-04-25',
    msg_time: '14:00',
    msg_type: '培训通知',
    msg_title: '支付系统操作培训',
    msg_handler: '培训中心',
    msg_summary: '培训通知已发布，课程内容待合规确认后展示。',
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
    msg_summary: '考核类公告已发布，正文待合规确认后展示。',
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
    msg_summary: '值班类公告已发布，正文待合规确认后展示。',
    notice_id: 'notice-duty-001',
  },
];

const noticeDetails: NoticeDetail[] = [
  {
    notice_id: 'notice-policy-001',
    notice_title: '收单政策更新通知',
    notice_type: '政策通知',
    msg_date: '2026-04-26',
    valid_start: '2026-05-01',
    valid_end: '2026-06-30',
    notice_content: [],
    content_status: 'pending_compliance',
  },
  {
    notice_id: 'notice-training-001',
    notice_title: '支付系统操作培训',
    notice_type: '培训通知',
    msg_date: '2026-04-25',
    training_time: '2026-05-10 14:00',
    training_method: '线上',
    notice_content: [],
    attention_notes: [],
    content_status: 'pending_compliance',
  },
  {
    notice_id: 'notice-assessment-001',
    notice_title: '季度考核说明会通知',
    notice_type: '通知公告',
    msg_date: '2026-04-24',
    announcement_kind: 'assessment',
    content_sections: [],
    content_status: 'pending_compliance',
  },
  {
    notice_id: 'notice-duty-001',
    notice_title: '假期值班安排通知',
    notice_type: '通知公告',
    msg_date: '2026-04-22',
    announcement_kind: 'duty',
    holiday_start: '2026-05-01',
    holiday_end: '2026-05-05',
    daily_schedule: [],
    duty_requirements: [],
    content_status: 'pending_compliance',
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
  if (detail.notice_type === '政策通知') return { ...detail, notice_content: [...detail.notice_content] };
  if (detail.notice_type === '培训通知') {
    return {
      ...detail,
      attention_notes: [...detail.attention_notes],
      notice_content: [...detail.notice_content],
    };
  }
  if (detail.announcement_kind === 'assessment') return { ...detail, content_sections: [...detail.content_sections] };
  return {
    ...detail,
    daily_schedule: [...detail.daily_schedule],
    duty_requirements: [...detail.duty_requirements],
  };
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
