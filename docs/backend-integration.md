# 백엔드 연동 계약

프론트엔드와 백엔드는 아래 경계를 기준으로 독립적으로 작업합니다. 실제 엔드포인트가 달라지면 화면이 아니라 `src/services/analysisApi.ts`만 수정합니다.

## 환경 변수

| 이름                | 설명                | 개발 기본값                 |
| ------------------- | ------------------- | --------------------------- |
| `VITE_API_BASE_URL` | API 공통 주소       | `http://localhost:8080/api` |
| `VITE_USE_MOCK_API` | 샘플 응답 사용 여부 | `true`                      |

## 예상 API

### 분석 생성

`POST /analyses` · `multipart/form-data`

- `file` 또는 `text` 중 하나
- `documentType`: 문서 유형
- `scopes`: JSON 문자열 배열
- `maskingFields`: JSON 문자열 배열

응답: `{ "analysisId": "string" }`

### 진행 상태

`GET /analyses/:id`

```json
{
  "status": "processing",
  "progress": 48,
  "step": "규정 매칭"
}
```

`status`는 `queued | processing | completed | failed` 중 하나입니다.

### 결과 조회

`GET /analyses/:id/result`

서버의 공개 API 계약이 확정되면 `bareum-server/packages/contracts/`에서 관리하고, 프론트는 필요한 공개 필드·상태·오류 형식을 `src/services/contracts.ts`에서 검증합니다. 계약 변경 시 서버 원본과 화면 소비 코드를 함께 검토합니다.

### 이슈 상태 변경

`PATCH /analyses/:analysisId/issues/:issueId`

요청: `{ "status": "resolved" }`

### 파일 내보내기

`POST /analyses/:analysisId/exports`

요청: `{ "kind": "document | report", "format": "PDF | DOCX | HWPX" }`

응답 본문은 파일 Blob이며, 파일명은 `x-filename` 헤더로 전달합니다. Mock API에서는 다운로드 동작 확인을 위한 텍스트 파일을 생성합니다.

## 공유 기능 결정

공유 링크는 문서 저장 위치, 사용자별 접근 권한, 링크 만료와 폐기 정책이 필요하므로 현재 범위에서 제외합니다. 정책과 백엔드 API가 합의되기 전에는 UI에도 공유 버튼을 노출하지 않습니다.

## 오류 형식

모든 오류는 가능하면 아래 구조를 반환합니다.

```json
{ "code": "ANALYSIS_TIMEOUT", "message": "규정 조회 시간이 초과되었습니다." }
```

## 협업 규칙

1. API 응답 필드를 바꾸면 `contracts.ts`와 이 문서를 같은 PR에서 수정합니다.
2. 화면 컴포넌트에서 `fetch`를 직접 호출하지 않습니다.
3. 서버 데이터는 React Query, 입력 중인 로컬 데이터는 컴포넌트 훅으로 관리합니다.
4. API 요청에는 취소 가능한 `AbortSignal`을 전달합니다.
5. 백엔드 연결 전에는 Mock API로 전체 사용자 흐름을 검증합니다.
