<template>
  <main class="notice-detail">
    <header class="notice-detail__header">
      <button class="notice-detail__back" type="button" @click="goBack">返回</button>
      <h1 class="notice-detail__page-title">通知详情</h1>
    </header>

    <section v-if="loading" class="notice-detail__loading">加载中</section>
    <section v-else-if="loadError" class="notice-detail__error">
      <span class="notice-detail__error-text"><!-- TODO(HZYMiniAppStyle): 详情加载失败展示文案由样式层接入 --></span>
      <button class="notice-detail__retry" type="button" @click="loadNoticeDetail">重试</button>
    </section>
    <section v-else-if="detail" class="notice-detail__body" :data-notice-type="detail.notice_type">
      <div class="notice-detail__meta">
        <span class="notice-detail__type">{{ detail.notice_type }}</span>
        <span class="notice-detail__date">{{ detail.msg_date }}</span>
      </div>

      <h2 class="notice-detail__title">{{ detail.notice_title }}</h2>

      <section v-if="detail.notice_type === '政策通知'" class="notice-detail__policy">
        <dl class="notice-detail__fields">
          <div class="notice-detail__field">
            <dt>有效期开始</dt>
            <dd>{{ detail.valid_start }}</dd>
          </div>
          <div class="notice-detail__field">
            <dt>有效期结束</dt>
            <dd>{{ detail.valid_end }}</dd>
          </div>
        </dl>
        <div v-if="detail.notice_content.length" class="notice-detail__rich-text" data-content-field="notice_content">
          <p v-for="paragraph in detail.notice_content" :key="paragraph">{{ paragraph }}</p>
        </div>
      </section>

      <section v-else-if="detail.notice_type === '培训通知'" class="notice-detail__training">
        <dl class="notice-detail__fields">
          <div class="notice-detail__field">
            <dt>培训时间</dt>
            <dd>{{ detail.training_time }}</dd>
          </div>
          <div class="notice-detail__field">
            <dt>培训方式</dt>
            <dd>{{ detail.training_method }}</dd>
          </div>
        </dl>
        <div v-if="detail.notice_content.length" class="notice-detail__rich-text" data-content-field="notice_content">
          <p v-for="paragraph in detail.notice_content" :key="paragraph">{{ paragraph }}</p>
        </div>
        <div v-if="detail.attention_notes.length" class="notice-detail__notes" data-content-field="attention_notes">
          <p v-for="note in detail.attention_notes" :key="note">{{ note }}</p>
        </div>
      </section>

      <section v-else-if="detail.announcement_kind === 'assessment'" class="notice-detail__announcement" data-announcement-kind="assessment">
        <div v-if="detail.content_sections.length" class="notice-detail__sections" data-content-field="content_sections">
          <p v-for="section in detail.content_sections" :key="section">{{ section }}</p>
        </div>
      </section>

      <section v-else class="notice-detail__announcement" data-announcement-kind="duty">
        <dl class="notice-detail__fields">
          <div class="notice-detail__field">
            <dt>假期开始</dt>
            <dd>{{ detail.holiday_start }}</dd>
          </div>
          <div class="notice-detail__field">
            <dt>假期结束</dt>
            <dd>{{ detail.holiday_end }}</dd>
          </div>
        </dl>
        <div v-if="detail.daily_schedule.length" class="notice-detail__schedule" data-content-field="daily_schedule">
          <p v-for="item in detail.daily_schedule" :key="item">{{ item }}</p>
        </div>
        <div v-if="detail.duty_requirements.length" class="notice-detail__requirements" data-content-field="duty_requirements">
          <p v-for="item in detail.duty_requirements" :key="item">{{ item }}</p>
        </div>
      </section>

      <div v-if="compliancePending" class="notice-detail__compliance-pending" data-observable="notice-content-pending-compliance">
        <!-- TODO(HZYCompliance): 政策/培训/公告富文本 mock 待合规确认后接入；逻辑层不自填占位正文 -->
      </div>
    </section>

    <div v-if="loadFailure" class="notice-detail__load-failure" data-observable="notice-detail-load-failed">
      <!-- TODO(HZYMiniAppStyle): 网络异常态可观察占位，最终展示文案由样式层补充 -->
    </div>
  </main>
</template>

<script setup lang="ts">
import { useNoticeDetail } from './messageLogic';

const {
  compliancePending,
  detail,
  goBack,
  loadError,
  loadFailure,
  loadNoticeDetail,
  loading,
} = useNoticeDetail();
</script>
