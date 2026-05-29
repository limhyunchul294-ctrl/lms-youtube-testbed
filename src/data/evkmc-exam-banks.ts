/** 시험 문항 은행 — docx 전체 반영 전까지 API/관리자에서 확장 가능 */

export type ExamBankItem = {
  label: string
  options: string[]
  correct: number
  kind?: 'recall' | 'case'
  stem?: string
}

export type ExamQuestionSeed = ExamBankItem & { id: string }

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

const ecoCaseBank: ExamBankItem[] = [
  {
    kind: 'case',
    stem: '친환경차 고객이 급가속 시 출력 제한과 HV 경고등이 켜진다고 합니다. 정비 이력상 최근 충전기 불량 접촉 이력이 있습니다.',
    label: '가장 먼저 수행할 점검 순서로 적절한 것은?',
    options: [
      '즉시 배터리 팩 분해',
      'DTC·충전 이력 확인 후 제조사 절차에 따른 전원 차단·측정',
      '일반 승용차와 동일하게 엔진 오일 교환',
      '고객 안내 없이 시운전',
    ],
    correct: 1,
  },
  {
    kind: 'case',
    stem: '완속 충전 중 충전이 10분 후 중단된다고 합니다. 인렛 주변에 습기 흔적이 보입니다.',
    label: '우선 의심·조치로 가장 적절한 것은?',
    options: [
      '인렛·케이블·차량 측 인터록·접지 상태 점검',
      '타이어 공기압만 조정',
      '엔진 냉각수 교환',
      '배터리 셀 임의 교체',
    ],
    correct: 0,
  },
  {
    kind: 'case',
    stem: '저속 회생 제동 시 모터 구역에서 금속성 소음이 난다고 합니다. 최근 리프트 작업 후 볼트 체결 이력이 불명확합니다.',
    label: '안전한 대응으로 적절한 것은?',
    options: [
      '고속 시운전으로 재현',
      '무리한 주행 중단 후 고정·마모·토크 점검',
      '고전압 배터리 즉시 개방',
      'PPE 없이 측정',
    ],
    correct: 1,
  },
  {
    kind: 'case',
    stem: '겨울철 주행 후 충전이 시작되지 않는다고 합니다. 배터리 온도 관련 경고가 간헐적으로 표시됩니다.',
    label: '다음 조치로 가장 적절한 것은?',
    options: [
      'BMS·온도 센서·충전 조건(프리컨디셔닝) 확인',
      '연료 필터 교환',
      '와이퍼 모터 교체',
      '배터리 방전 방치',
    ],
    correct: 0,
  },
]

const hvCaseBank: ExamBankItem[] = [
  ...ecoCaseBank,
  {
    kind: 'case',
    stem: '고전압 작업 구역에서 승인되지 않은 금속 도구를 사용한 뒤 아크 소리가 났다고 보고됩니다.',
    label: '즉시 취해야 할 조치로 적절한 것은?',
    options: [
      '작업 중단·전원 차단·2인 확인·사고 보고',
      '작업 계속',
      '고객에게 직접 측정 요청',
      'PPE 미착용 상태 점검',
    ],
    correct: 0,
  },
  {
    kind: 'case',
    stem: '배터리 팩 주변에서 화학 냄새와 온도 상승이 관측되었습니다. 차량이 최근 충돌 사고를 당했습니다.',
    label: '가장 우선할 안전 조치는?',
    options: [
      '격리·전원 차단·열폭주 대비·전문 인력 호출',
      '즉시 급속 충전',
      '배터리 개방 후 환기만 실시',
      '일반 세차',
    ],
    correct: 0,
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

function pickFromBank(bank: ExamBankItem[], index: number, suffix: string): ExamBankItem {
  const item = bank[index % bank.length]
  return {
    ...item,
    label: suffix ? `[${suffix}] ${item.label}` : item.label,
  }
}

export function buildExamQuestionsFromBank(bank: ExamBankItem[], count: number): ExamQuestionSeed[] {
  if (count <= 0) return []
  return Array.from({ length: count }, (_, i) => {
    const item = pickFromBank(bank, i, count > bank.length ? String(i + 1) : '')
    return {
      id: `q${i + 1}`,
      label: item.label,
      options: item.options,
      correct: item.correct,
      ...(item.kind ? { kind: item.kind } : {}),
      ...(item.stem ? { stem: item.stem } : {}),
    }
  })
}

/** 암기형·사례판단형을 혼합한 시험 문항 생성 (기본 사례 비율 35%) */
export function buildMixedExamQuestions(
  recallBank: ExamBankItem[],
  caseBank: ExamBankItem[],
  count: number,
  caseRatio = 0.35
): ExamQuestionSeed[] {
  if (count <= 0) return []
  const caseCount = Math.min(count, Math.max(1, Math.round(count * caseRatio)))
  const recallCount = count - caseCount

  const caseItems = Array.from({ length: caseCount }, (_, i) => {
    const item = pickFromBank(caseBank, i, caseCount > caseBank.length ? `사례${i + 1}` : '')
    return {
      id: `c${i + 1}`,
      kind: 'case' as const,
      stem: item.stem || item.label,
      label: item.label,
      options: item.options,
      correct: item.correct,
    }
  })

  const recallItems = Array.from({ length: recallCount }, (_, i) => {
    const item = pickFromBank(recallBank, i, recallCount > recallBank.length ? String(i + 1) : '')
    return {
      id: `r${i + 1}`,
      kind: 'recall' as const,
      label: item.label,
      options: item.options,
      correct: item.correct,
    }
  })

  return [...caseItems, ...recallItems].map((q, i) => ({ ...q, id: `q${i + 1}` }))
}

export function getEcoExamQuestions(count = 30, caseRatio = 0.35) {
  return buildMixedExamQuestions(ecoBank, ecoCaseBank, count, caseRatio)
}

export function getHvExamQuestions(count = 60, caseRatio = 0.35) {
  return buildMixedExamQuestions(hvBank, hvCaseBank, count, caseRatio)
}
