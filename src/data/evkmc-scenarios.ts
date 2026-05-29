/** 현업 시나리오형 학습카드 (증상 → 진단 → 조치) */

export type ScenarioCard = {
  title?: string
  symptom: string
  diagnosis: string
  action: string
}

export const EVKMC_GUIDE_SCENARIOS: ScenarioCard[] = [
  {
    title: '경고등 점등',
    symptom: '주행 중 HV(고전압) 경고등이 간헐적으로 켜지고 출력이 제한됩니다.',
    diagnosis: 'BMS·접지·고전압 커넥터 이상 가능성을 의심하고 DTC·전압 이력을 확인합니다.',
    action: '제조사 절차에 따라 전원 차단 후 절연 장비를 착용하고, 승인된 진단 장비로 측정·기록합니다.',
  },
  {
    title: '충전 불가',
    symptom: '완속 충전기 연결 시 충전이 시작되지 않거나 중간에 중단됩니다.',
    diagnosis: '충전 케이블·인렛·충전 ECU 통신 및 차량 측 차단(인터록) 상태를 점검합니다.',
    action: '다른 충전기·케이블로 교차 확인 후, 이상 지속 시 고전압 시스템 점검 전 잔류전압·PPE를 준수합니다.',
  },
  {
    title: '소음·진동',
    symptom: '저속 주행·회생 제동 시 모터 구역에서 이상 소음이 발생합니다.',
    diagnosis: '구동계·감속기·냉각 펌프 등 부품 이음과 고정 볼트 풀림을 우선 확인합니다.',
    action: '무리한 시운전을 중단하고, 리프트·지그 사용 등 안전한 작업 환경에서 토크·마모 상태를 점검합니다.',
  },
]
