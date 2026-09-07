import type { AnalysisResult } from '../types';
const s = (text: string, issueId?: string, level?: 'high' | 'medium' | 'low') => ({
  text,
  issueId,
  level,
});
export const sampleResult: AnalysisResult = {
  id: 'analysis-demo',
  title: '갯벌축제 계획 보고서',
  filename: '갯벌축제_계획_v3.hwpx',
  reviewedAt: '2026-09-05 14:22',
  score: 62,
  grade: 'C',
  sections: [
    {
      id: 's1',
      number: 1,
      title: '사업 개요',
      paragraphs: [
        [
          s('본 사업은 지역 관광 활성화 및 지역 경제 파급효과 창출을 목적으로 한다. '),
          s('근거 법령은 별도로 명시하지 않았다.', 'i1', 'high'),
          s(' 사업 기간은 2026년 4월부터 10월까지이며, 총 예산은 '),
          s('2억 3천만 원', 'i2', 'medium'),
          s('으로 편성한다.'),
        ],
      ],
    },
    {
      id: 's2',
      number: 2,
      title: '추진 배경 및 필요성',
      paragraphs: [
        [
          s(
            '인근 지자체의 축제가 최근 3년간 평균 방문객 12만 명을 기록하는 등 유사 사례의 성장세가 뚜렷하며, ',
          ),
          s('본 지자체는 관광 콘텐츠가 부족한 실정이다.', 'i3', 'medium'),
          s(' 이에 갯벌 자원을 활용한 지역 특화 축제의 조성이 필요하다.'),
        ],
      ],
    },
    {
      id: 's3',
      number: 3,
      title: '사업 목표',
      paragraphs: [
        [
          s(
            '연간 방문객 5만 명 유치, 지역 상권 매출 8억 원 창출, 안전사고 무사고 운영을 목표로 한다.',
          ),
        ],
      ],
    },
    {
      id: 's4',
      number: 4,
      title: '추진 내용',
      paragraphs: [
        [
          s('축제 운영 인력은 총 42명이며 사전 안전 교육을 이수한다. '),
          s('관계 기관과의 협의 사항은 별첨 3에 정리한다.', 'i4', 'low'),
          s(' 참여 프로그램은 체험형·전시형·공연형의 3개 유형으로 구성한다.'),
        ],
      ],
    },
    {
      id: 's5',
      number: 5,
      title: '예산 및 재원 조달',
      paragraphs: [
        [
          s('총 예산 '),
          s('2.3억', 'i2', 'medium'),
          s(' 중 도비 40%, 시비 40%, 자체 20%의 비율로 편성하되 '),
          s('구체적 산출 근거는 미제시.', 'i5', 'high'),
          s(' 예산 집행 계획은 분기별로 관리한다.'),
        ],
      ],
    },
    {
      id: 's6',
      number: 6,
      title: '기대 효과',
      paragraphs: [
        [
          s('본 사업의 완료 후 지속 운영 계획은 추후 별도 수립.', 'i6', 'low'),
          s(' 지역 상권 매출 증대, 관광 브랜드 강화, 지역 정체성 회복 등을 기대한다.'),
        ],
      ],
    },
  ],
  issues: [
    {
      id: 'i1',
      level: 'high',
      status: 'open',
      sectionId: 's1',
      section: '1. 사업 개요',
      title: '근거 법령 미기재',
      summary: '사업 개요에 근거 법령이 명시되지 않았습니다.',
      original: '근거 법령은 별도로 명시하지 않았다.',
      suggestion:
        '본 사업은 「지방재정법」 제37조 제1항 및 「지역축제 운영 기본지침」 제5조에 근거하여 시행한다.',
      explanation:
        '예산이 수반되는 지역축제 사업은 근거 법령 또는 상위 지침을 서두에 명기해야 합니다.',
      evidence: [
        { source: '지방재정법 제37조', quote: '예산 편성 및 집행의 근거를 명시합니다.' },
        { source: '지역축제 운영 기본지침', quote: '사업의 근거 법령과 상위 계획을 명시합니다.' },
      ],
    },
    {
      id: 'i2',
      level: 'medium',
      status: 'open',
      sectionId: 's1',
      section: '1. 사업 개요 / 5. 예산',
      title: '숫자 표기 상이',
      summary: "예산 표기가 '2억 3천만 원'과 '2.3억'으로 다릅니다.",
      original: '총 예산은 2억 3천만 원 … 총 예산 2.3억',
      suggestion: "본문 전반에 걸쳐 '230,000,000원(2억 3천만 원)'으로 통일합니다.",
      explanation: '동일 금액은 문서 전체에서 같은 형식으로 표기해야 합니다.',
      evidence: [
        {
          source: '공공기관 문서 작성 표준 가이드',
          quote: '동일 수치는 문서 내 일관된 표기로 통일합니다.',
        },
      ],
    },
    {
      id: 'i3',
      level: 'medium',
      status: 'open',
      sectionId: 's2',
      section: '2. 추진 배경',
      title: '정성적 주장 · 근거 부족',
      summary: "'관광 콘텐츠가 부족'이라는 주장을 뒷받침하는 데이터가 없습니다.",
      original: '본 지자체는 관광 콘텐츠가 부족한 실정이다.',
      suggestion: '등록 관광 프로그램 수와 도내 평균 등 근거 수치를 함께 기술합니다.',
      explanation: '정성적 서술만으로는 사업 필요성 입증이 어렵습니다.',
      evidence: [
        {
          source: '지역축제 평가지침 II-2',
          quote: '필요성 항목은 정량 지표 1개 이상을 포함합니다.',
        },
      ],
    },
    {
      id: 'i4',
      level: 'low',
      status: 'resolved',
      sectionId: 's4',
      section: '4. 추진 내용',
      title: '표기 통일',
      summary: "'별첨 3' 참조 표기를 문서 규칙에 맞게 통일했습니다.",
      original: '별첨 3에 정리한다.',
      suggestion: '(별첨 3)에 정리한다.',
      explanation: '별첨 참조 형식을 문서 안에서 통일합니다.',
      evidence: [
        { source: '공공기관 문서 작성 표준 가이드', quote: '별첨 참조 형식을 일치시킵니다.' },
      ],
    },
    {
      id: 'i5',
      level: 'high',
      status: 'open',
      sectionId: 's5',
      section: '5. 예산',
      title: '산출 근거 미제시',
      summary: '재원 조달 비율의 산출 근거가 제시되지 않았습니다.',
      original: '구체적 산출 근거는 미제시.',
      suggestion: '도비·시비·자체 재원 각각의 조달 근거를 항목별로 명시합니다.',
      explanation: '재원 조달 비율은 근거 원천과 함께 기재해야 합니다.',
      evidence: [
        { source: '지방보조금 관리기준 §12', quote: '보조 비율은 산출 근거와 함께 명시합니다.' },
      ],
    },
    {
      id: 'i6',
      level: 'low',
      status: 'open',
      sectionId: 's6',
      section: '6. 기대 효과',
      title: '지속가능성 정보 부족',
      summary: '지속 운영 계획이 별도 수립 예정으로 남아 있습니다.',
      original: '지속 운영 계획은 추후 별도 수립.',
      suggestion: '운영 주체·재원·평가 지표를 포함한 개요를 서술합니다.',
      explanation: '지속 운영 계획은 사업 심사의 필수 검토 항목입니다.',
      evidence: [
        {
          source: '지역축제 평가지침 IV-3',
          quote: '지속 운영 방안은 개요 이상 수준으로 기술합니다.',
        },
      ],
    },
  ],
};
