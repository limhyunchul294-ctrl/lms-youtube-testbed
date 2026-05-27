/** 시험 문항 은행 — docx 전체 반영 전까지 API/관리자에서 확장 가능 */

export type ExamBankItem = {
  label: string
  options: string[]
  correct: number
}

const ecoBank: ExamBankItem[] = [
  {
    label: '친환경차(EV)의 동력 전달에 가장 가까운 설명은?',
    options: ['엔진만 구동', '모터·인버터·배터리로 구동', '변속기만 구동', '연료탱크 압력 구동'],
    correct: 1,
  },
  {
    label: '고전압 배터리 작업 전 가장 먼저 해야 할 것은?',
    options: ['장갑만 착용', '전원 차단·잔류전압 확인', '즉시 분해', '일반 승용차와 동일 시행'],
    correct: 1,
  },
  {
    label: 'LMS에서 강의 완료로 인정되는 시청 비율은?',
    options: ['50%', '70%', '90%', '100% 필수'],
    correct: 2,
  },
  {
    label: 'BMS(Battery Management System)의 주요 역할은?',
    options: ['타이어 공기압만 측정', '배터리 상태·안전 모니터링', '엔진 점화 시기 제어', '와이퍼 속도 제어'],
    correct: 1,
  },
  {
    label: '회생 제동(Regenerative Braking)의 효과는?',
    options: ['연료 소비 증가', '주행 중 일부 에너지를 배터리로 회수', '배터리를 영구 충전', '엔진 오일 교환 주기 단축'],
    correct: 1,
  },
  {
    label: '고전압 케이블 식별에 자주 쓰이는 색상 조합은?',
    options: ['주황 고전압 표시', '녹색만 사용', '색상 표시 없음', '파란색만 사용'],
    correct: 0,
  },
  {
    label: '일부 공개(Unlisted) YouTube 영상의 특징은?',
    options: ['검색에 노출', 'URL·ID 아는 사람만 시청 가능', '누구나 다운로드 불가 보장', 'LMS 임베드 불가'],
    correct: 1,
  },
  {
    label: '친환경차 정비 시 PPE(개인보호구)에 포함되지 않는 것은?',
    options: ['절연 장갑', '안전화', '일반 슬리퍼', '보안경'],
    correct: 2,
  },
  {
    label: '인버터(Inverter)의 역할은?',
    options: ['DC를 AC로 변환해 모터 구동', '엔진 냉각수 순환', '연료 분사량 조절', '배터리 셀 제조'],
    correct: 0,
  },
  {
    label: '고전압 시스템 작업 후 반드시 확인할 것은?',
    options: ['라디오 볼륨', '잔류 전압·시스템 정상 복구', '에어컨 필터', '와이퍼 모터'],
    correct: 1,
  },
]

const hvBank: ExamBankItem[] = [
  ...ecoBank,
  {
    label: '고전압 배터리 팩 분해는 누가 수행해야 하나요?',
    options: ['누구나 가능', '교육·자격을 갖춘 담당자', '고객이 직접', '영업 담당자만'],
    correct: 1,
  },
  {
    label: '아크(전기 아크) 위험이 큰 상황은?',
    options: ['단락·도구 낙하로 극간 접촉', '저속 주행', '타이어 공기압 측정', '실내 세차'],
    correct: 0,
  },
  {
    label: '고전압 라벨이 붙은 구역에서 금지되는 행동은?',
    options: ['절차에 따른 측정', '승인 없는 도구 사용·무단 작업', 'PPE 착용', '2인 작업'],
    correct: 1,
  },
  {
    label: '배터리 열폭주(Thermal runaway) 예방에 해당하는 것은?',
    options: ['과충전·손상 셀 방치', 'BMS·온도 모니터링·정기 점검', '배터리 개방 보관', '임의 개조'],
    correct: 1,
  },
  {
    label: '고전압 차량 견인 시 주의사항은?',
    options: ['제조사 절차·전원 차단 준수', '일반 승용차와 동일', '속도 무관', '배터리 분리 불필요'],
    correct: 0,
  },
]

export function buildExamQuestionsFromBank(
  bank: ExamBankItem[],
  count: number
): Array<ExamBankItem & { id: string }> {
  if (count <= 0) return []
  return Array.from({ length: count }, (_, i) => {
    const item = bank[i % bank.length]
    return {
      id: `q${i + 1}`,
      label: count > bank.length ? `[${i + 1}] ${item.label}` : item.label,
      options: item.options,
      correct: item.correct,
    }
  })
}

export function getEcoExamQuestions(count = 30) {
  return buildExamQuestionsFromBank(ecoBank, count)
}

export function getHvExamQuestions(count = 60) {
  return buildExamQuestionsFromBank(hvBank, count)
}
