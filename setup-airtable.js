#!/usr/bin/env node
/**
 * Airtable Base 테이블 자동 생성 스크립트
 * 
 * 사용법:
 *   AIRTABLE_PERSONAL_TOKEN=pat_xxx AIRTABLE_BASE_ID=appXXX node setup-airtable.js
 * 
 * 또는 .env.local 파일이 있는 프로젝트 루트에서:
 *   node setup-airtable.js
 */

const fs = require('fs')
const path = require('path')

// .env.local에서 환경변수 읽기
try {
  const envPath = path.join(__dirname, '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
      const [key, ...vals] = line.split('=')
      if (key && !key.startsWith('#')) {
        process.env[key.trim()] = vals.join('=').trim()
      }
    })
  }
} catch (e) {}

const TOKEN = process.env.AIRTABLE_PERSONAL_TOKEN
const BASE_ID = process.env.AIRTABLE_BASE_ID

if (!TOKEN || !BASE_ID) {
  console.error('❌ AIRTABLE_PERSONAL_TOKEN과 AIRTABLE_BASE_ID를 설정해 주세요.')
  console.error('   .env.local 파일 또는 환경변수로 전달 가능합니다.')
  process.exit(1)
}

const API = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`

async function createTable(name, fields, description) {
  console.log(`\n📋 테이블 생성 중: ${name}`)

  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, description, fields }),
  })

  if (!res.ok) {
    const err = await res.text()
    if (err.includes('DUPLICATE_TABLE_NAME')) {
      console.log(`   ⏭️ 이미 존재함, 건너뜀`)
      return
    }
    console.error(`   ❌ 실패: ${err}`)
    return
  }

  const data = await res.json()
  console.log(`   ✅ 생성 완료 (ID: ${data.id})`)
}

async function main() {
  console.log('🔧 Airtable LMS Base 설정 시작')
  console.log(`   Base ID: ${BASE_ID}`)

  // ── 1. courses 테이블 ──
  await createTable('courses', [
    { name: 'course_id', type: 'singleLineText', description: 'Supabase course UUID' },
    { name: 'title', type: 'singleLineText', description: '강의 제목' },
    { name: 'description', type: 'multilineText', description: '강의 설명' },
    { name: 'is_published', type: 'checkbox', options: { color: 'greenBright' } },
    { name: 'sort_order', type: 'number', options: { precision: 0 } },
  ], '강의 목록 (Supabase에서 동기화)')

  // 200ms 딜레이 (rate limit)
  await new Promise(r => setTimeout(r, 250))

  // ── 2. lessons 테이블 ──
  await createTable('lessons', [
    { name: 'lesson_id', type: 'singleLineText', description: 'Supabase lesson UUID' },
    { name: 'course_name', type: 'singleLineText', description: '소속 강의명' },
    { name: 'title', type: 'singleLineText', description: '레슨 제목' },
    { name: 'youtube_id', type: 'singleLineText', description: 'YouTube 영상 ID' },
    { name: 'duration_min', type: 'number', options: { precision: 0 }, description: '영상 길이 (분)' },
    { name: 'sort_order', type: 'number', options: { precision: 0 } },
  ], '레슨 목록 (Supabase에서 동기화)')

  await new Promise(r => setTimeout(r, 250))

  // ── 3. progress 테이블 (핵심) ──
  await createTable('progress', [
    { name: 'sync_key', type: 'singleLineText', description: 'email__course (유니크 키)' },
    { name: 'email', type: 'email', description: '수강생 이메일' },
    { name: 'course', type: 'singleLineText', description: '강의명' },
    { name: 'completed', type: 'number', options: { precision: 0 }, description: '완료한 레슨 수' },
    { name: 'total', type: 'number', options: { precision: 0 }, description: '전체 레슨 수' },
    { name: 'progress_pct', type: 'percent', options: { precision: 0 }, description: '진도율 (%)' },
    { name: 'status', type: 'singleSelect', options: {
      choices: [
        { name: '미시작', color: 'grayLight2' },
        { name: '학습중', color: 'blueLight2' },
        { name: '수료완료', color: 'greenLight2' },
      ]
    }},
    { name: 'synced_at', type: 'dateTime', options: {
      dateFormat: { name: 'iso' },
      timeFormat: { name: '24hour' },
      timeZone: 'Asia/Seoul',
    }, description: '마지막 동기화 시각' },
  ], '수강생별 강의 진도 현황')

  await new Promise(r => setTimeout(r, 250))

  // ── 4. students 테이블 (요약) ──
  await createTable('students', [
    { name: 'email', type: 'email', description: '수강생 이메일 (유니크 키)' },
    { name: 'enrolled_courses', type: 'number', options: { precision: 0 }, description: '등록 강의 수' },
    { name: 'total_lessons', type: 'number', options: { precision: 0 }, description: '전체 레슨 수' },
    { name: 'completed_lessons', type: 'number', options: { precision: 0 }, description: '완료 레슨 수' },
    { name: 'overall_pct', type: 'percent', options: { precision: 0 }, description: '전체 진도율' },
    { name: 'status', type: 'singleSelect', options: {
      choices: [
        { name: '미시작', color: 'grayLight2' },
        { name: '학습중', color: 'blueLight2' },
        { name: '전과정수료', color: 'greenLight2' },
      ]
    }},
    { name: 'synced_at', type: 'dateTime', options: {
      dateFormat: { name: 'iso' },
      timeFormat: { name: '24hour' },
      timeZone: 'Asia/Seoul',
    }},
  ], '수강생 요약 (1인 1행)')

  console.log('\n✅ 모든 테이블 생성 완료!')
  console.log('\n📌 다음 단계:')
  console.log('   1. Airtable에서 Base를 열어 테이블 4개 확인')
  console.log('   2. progress 테이블에서 Group by "status" 뷰 추가')
  console.log('   3. students 테이블에서 Gallery View 추가')
  console.log('   4. 관리자 대시보드에서 "Airtable 동기화" 버튼 클릭으로 테스트')
}

main().catch(console.error)
