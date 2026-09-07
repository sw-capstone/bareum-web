# 바름 웹 프론트엔드

공공보고서의 형식, 내용, 수치와 규정 준수를 검토하는 서비스의 프론트엔드입니다.

## 실행

```bash
npm install
npm run dev
```

## 품질 확인

```bash
npm run check
```

포맷, ESLint, 단위 테스트, TypeScript 검사와 프로덕션 빌드를 한 번에 실행합니다.

## 백엔드 연동

- 환경 변수는 `.env.example`을 참고합니다.
- 현재 `VITE_USE_MOCK_API=true`에서는 샘플 데이터로 전체 흐름을 확인할 수 있습니다.
- 실제 API 연동은 `.env`의 `VITE_USE_MOCK_API=false`로 전환합니다.
- 응답 데이터는 `src/services/contracts.ts`의 Zod 스키마로 런타임 검증합니다.
- HTTP 오류는 `ApiError` 한 종류로 표준화합니다.
- 예상 흐름: `POST /analyses` → `GET /analyses/:id` 폴링 → `GET /analyses/:id/result` → 이슈 변경/내보내기 API.

## 구조

- `src/app`: 전역 Provider와 URL 라우팅
- `src/components/ui`: 재사용 가능한 기본 UI
- `src/contexts`: 로그인 세션 등 클라이언트 전역 상태
- `src/features`: 인증, 업로드, 분석, 결과, 리포트 화면
- `src/hooks`: 업로드·분석·필터·이슈 편집 로직
- `src/services`: API 계약, HTTP 클라이언트와 백엔드 통신 경계
- `src/mocks`: 개발용 샘플 응답
- `src/styles`: 디자인 토큰과 전역 스타일

브랜드 로고는 아직 확정되지 않아 `Brand` 컴포넌트가 텍스트 기반 임시 마크를 사용합니다. 추후 이 컴포넌트만 교체하면 됩니다.

상세 API 계약과 협업 규칙은 [`docs/backend-integration.md`](docs/backend-integration.md)를 참고하세요.
