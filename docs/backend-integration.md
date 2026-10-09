# 백엔드 연동 가정

아래 엔드포인트와 필드는 프론트 개발을 위한 현재 연동 가정이며, 서버의 확정 계약이 아닙니다. 공개 API 계약이 합의되면 서버 계약을 기준으로 이 문서와 `src/services/contracts.ts`·`src/services/analysisApi.ts`를 함께 갱신합니다. 화면에서는 HTTP 요청을 직접 처리하지 않습니다.

## 환경 변수

| 이름                | 설명                | 개발 기본값                 |
| ------------------- | ------------------- | --------------------------- |
| `VITE_API_BASE_URL` | API 공통 주소       | `http://localhost:8080/api` |
| `VITE_USE_MOCK_API` | 샘플 응답 사용 여부 | `true`                      |

## 예상 API

### 인증 API

인증 화면은 `src/services/authApi.ts`만 호출하며, 화면 컴포넌트는 Mock 저장소나 HTTP 세부 구현을 직접 참조하지 않습니다. 아래 경로와 오류 코드는 프론트 연동을 위한 제안 계약이므로 서버 담당자와 확정 후 함께 수정합니다.

#### 이메일 인증번호 발송

`POST /auth/email-verifications`

요청:

```json
{ "email": "name@gov.kr", "purpose": "signup | password-reset" }
```

응답: `{ "expiresIn": 300 }`

#### 이메일 인증번호 확인

`POST /auth/email-verifications/confirm`

요청:

```json
{ "email": "name@gov.kr", "purpose": "signup | password-reset", "code": "123456" }
```

응답: `{ "verificationToken": "일회성 인증 토큰" }`

인증 토큰은 가입 또는 비밀번호 재설정 요청에만 사용하며 브라우저 저장소에 보관하지 않습니다. 서버도 용도와 만료시간을 다시 검증해야 합니다.

#### 회원가입

`POST /auth/signup`

요청에는 `name`, `email`, `password`, `verificationToken`과 `agreements`를 포함합니다. 성공 응답은 `204 No Content`를 사용합니다.

#### 비밀번호 재설정

`POST /auth/password-reset`

요청에는 `email`, `password`, `verificationToken`을 포함합니다. 성공 응답은 `204 No Content`를 사용합니다.

예상 오류 코드는 `EMAIL_ALREADY_REGISTERED`, `EMAIL_NOT_REGISTERED`, `INVALID_VERIFICATION_CODE`, `VERIFICATION_EXPIRED`입니다. 공통 오류 본문 형식은 아래 오류 형식을 따릅니다.

로그인 세션을 쿠키로 관리할지 액세스 토큰으로 관리할지는 아직 확정되지 않았습니다. 쿠키 방식이면 CORS와 `credentials` 정책을, 토큰 방식이면 갱신·폐기·저장 위치를 서버와 함께 결정해야 합니다.

#### 로그인 및 로그아웃

`POST /auth/login`

요청:

```json
{ "email": "name@gov.kr", "password": "...", "keepSignedIn": true }
```

응답:

```json
{ "user": { "name": "박바름", "email": "name@gov.kr" } }
```

`POST /auth/logout`은 성공 시 `204 No Content`를 반환합니다. 로그인하지 않은 사용자가 보호 화면에 접근하면 프론트는 로그인 화면으로 이동시키며, 서버도 모든 보호 API에서 세션 또는 토큰을 별도로 검증해야 합니다.

### 분석 생성

`POST /analyses` · `multipart/form-data`

- `file` 또는 `text` 중 하나
- `documentType`: 문서 유형

응답: `{ "analysisId": "string" }`

### 진행 상태

`GET /analyses/:id`

```json
{
  "status": "processing",
  "progress": 48,
  "step": "규정",
  "filename": "갯벌축제_계획_v3.hwpx",
  "documentType": "계획 보고서",
  "checks": [
    { "id": "structure", "label": "구조", "status": "completed" },
    { "id": "regulation", "label": "규정", "status": "processing" }
  ]
}
```

`status`는 `queued | processing | paused | completed | partial_failed | failed | canceled` 중 하나입니다. `checks`는 서버에서 실제로 접수·완료된 순서대로 전달하며 각 항목의 `status`는 `pending | processing | completed | failed`입니다. 실패 항목에는 `errorCode`, `errorMessage`, `failedAt`을 선택적으로 포함합니다.

### 분석 취소 및 재분석

- `POST /analyses/:id/cancel`: 진행 중인 분석을 취소합니다. 이미 완료된 경우 `ANALYSIS_ALREADY_COMPLETED` 오류를 반환합니다.
- `POST /analyses/:id/pause`: 취소 확인 중인 분석을 일시 정지합니다.
- `POST /analyses/:id/resume`: 취소 확인을 닫은 분석을 중단 지점부터 재개합니다.
- `POST /analyses/:id/retry`: 기존 보고서와 문서 유형으로 분석을 다시 시작하고 `{ "analysisId": "string" }`을 반환합니다.

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

## 세 저장소의 연동 범위

실제 연동이 준비되면 계약 검사 외에 요청부터 결과 표시까지의 핵심 성공 흐름과 AI 시간 초과·오류가 화면에 전달되는 흐름을 검증한다. 검사한 웹·서버·AI의 Git SHA와 계약 버전을 기록하고, Mock 결과와 실제 연동 결과를 구분한다. 연동 변경 시 영향받는 조합을, 릴리스 후보에서는 핵심 전체 흐름을 검사한다. 현재 레포 간 자동 통합 검사는 연결되지 않았다.

웹은 `bareum-server`의 공개 API를 소비하고, AI 처리는 `bareum-server-ai`에서 관리한다. 웹↔서버 계약과 서버↔AI 계약은 변경 영향에 따라 따로 검토한다. AI 내부 변경이 공개 API에 영향을 주지 않으면 웹 코드 변경은 필요하지 않다. 계약 버전과 관련 PR을 연결해 적용 시점을 조율하며, 다른 저장소 내부 파일을 상대 경로로 직접 참조하지 않는다.
