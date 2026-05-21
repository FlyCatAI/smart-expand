export type MessageTabId = 'all' | 'policy' | 'training' | 'notice' | 'opportunity';

export type MessageType =
  | '商户动态'
  | '商机推送'
  | '业务动态'
  | '政策通知'
  | '培训通知'
  | '通知公告';

export type MessageTone = 'blue' | 'orange' | 'green' | 'red' | 'purple' | 'gray';

export interface MessageTab {
  tab_id: MessageTabId;
  tab_name: string;
  badge_count: number;
}

export interface DynamicMessage {
  msg_id: string;
  msg_date: string;
  msg_time: string;
  msg_type: MessageType;
  msg_title: string;
  msg_handler: string;
  msg_summary: string;
  merchant_id?: string;
  notice_id?: string;
}

export type TrainingMethod = '全员必修' | '线上' | '线下' | '直播';
export type NoticeContentStatus = 'approved' | 'pending_compliance';
export type NoticeAnnouncementKind = 'assessment' | 'duty';

export interface BaseNoticeDetail {
  notice_id: string;
  notice_title: string;
  notice_type: Extract<MessageType, '政策通知' | '培训通知' | '通知公告'>;
  msg_date: string;
  content_status: NoticeContentStatus;
}

export interface PolicyNoticeDetail extends BaseNoticeDetail {
  notice_type: '政策通知';
  valid_start: string;
  valid_end: string;
  notice_content: string[];
}

export interface TrainingNoticeDetail extends BaseNoticeDetail {
  notice_type: '培训通知';
  training_time: string;
  training_method: TrainingMethod;
  notice_content: string[];
  attention_notes: string[];
}

export interface AssessmentAnnouncementDetail extends BaseNoticeDetail {
  notice_type: '通知公告';
  announcement_kind: 'assessment';
  content_sections: string[];
}

export interface DutyAnnouncementDetail extends BaseNoticeDetail {
  notice_type: '通知公告';
  announcement_kind: 'duty';
  holiday_start: string;
  holiday_end: string;
  daily_schedule: string[];
  duty_requirements: string[];
}

export type NoticeDetail =
  | PolicyNoticeDetail
  | TrainingNoticeDetail
  | AssessmentAnnouncementDetail
  | DutyAnnouncementDetail;

export interface MessageFailure {
  target: string;
  reason: string;
  at: number;
}
