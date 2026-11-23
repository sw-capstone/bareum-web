# 백엔드 연동 계약

서버 `develop`에 머지된 인증 API는 실제 서버에 연결합니다. 아직 머지되지 않은 분석·내보내기 등은 기존 Mock 흐름을 유지합니다. 화면에서는 HTTP 요청을 직접 처리하지 않습니다.

## 환경 변수

| 이름                     | 설명                                            | 개발 기본값 |
| ------------------------ | ----------------------------------------------- | ----------- |
| `VITE_API_BASE_URL`      | 기존 공개 API 프록시 경로                       | `/api`      |
| `VITE_AUTH_API_BASE_URL` | 인증 쿠키 Path와 일치하는 동일 출처 경로        | `/api/v1`   |
| `VITE_USE_MOCK_API`      | 아직 미연동인 분석·내보내기 등의 목업 사용 여부 | `true`      |
| `VITE_GOOGLE_CLIENT_ID`  | Google Identity Services 웹 Client ID           | 빈 값       |

실제 환경별 값은 Git에 포함되지 않는 `.env.local` 또는 Vercel Environment Variables로 관리합니다. `.env.example`은 필요한 키와 안전한 개발 기본값만 문서화합니다. Google 웹 Client ID는 브라우저에 공개되는 식별자이지만, 환경별 교체와 운영 관리를 위해 코드에 직접 저장하지 않습니다. Client Secret은 어떤 프론트 설정에도 저장하지 않습니다.

브라우저는 동일 출처 경로를 호출합니다. 기존 공개 API는 `/api`에서 서버 `/api/v1`로 전달합니다. 인증 요청은 `/api/v1/auth`를 그대로 전달합니다. 서버 Refresh·CSRF 쿠키의 Path가 `/api/v1/auth`이므로 인증 프록시 경로도 이를 유지해야 합니다. Vite와 Vercel에 두 경로를 모두 설정합니다.

실제 API로 연결한 기능은 다음 다섯 가지입니다. `VITE_USE_MOCK_API=true`는 분석 등 미연동 화면에만 적용되며, 아래 인증 기능은 배포 환경 변수로 Mock으로 되돌릴 수 없습니다.

- `email-availability`
- `email-verification`
- `email-signup`
- `auth-session`
- `google-auth`

### 머지 완료 API

#### 이메일 사용 가능 여부

`GET /auth/email/availability?email={email}`

응답: `{ "available": true }`

#### 이메일 인증

- `POST /auth/email-verification`: 발송 접수
- `GET /auth/email-verification/deliveries/:requestId`: 발송 상태 조회
- `POST /auth/email-verification/resend`: 재발송
- `POST /auth/email-verification/code`: 인증번호 확인

발송·재발송 요청의 `purpose`는 `SIGNUP | PASSWORD_RESET`을 사용합니다. 발송 응답이 `PENDING`이면 `requestId`로 상태를 조회하고 `SENT`가 된 시점의 `expiresIn`으로 화면 타이머를 시작합니다. `FAILED | CANCELLED`는 사용자에게 실패로 안내합니다.

#### 약관 동의

화면의 약관 제목·본문·필수 여부는 프론트에서 정의합니다. 화면은 `GET /terms`를 호출하지 않으며, `age`, `service`, `privacy`에 모두 동의하면 가입 버튼을 활성화합니다. 선택 항목인 `marketing`은 동의하지 않아도 가입할 수 있습니다. 가입 요청에는 네 항목의 동의 여부를 `agreements`의 boolean 값으로 모두 전달합니다.

서버는 가입 시 활성 약관 레코드와 동의 상태를 대조합니다. 2026-11-19 배포 서버에서 필수 3개·선택 1개의 약관 코드가 조회되는 것을 확인했습니다. 서버 DB 버전 `dev-test-v1`은 내부 기록용이며 프론트에서 전달하지 않습니다. 화면의 임시 약관 문구는 확정된 원문으로 별도 교체해야 합니다.

#### 이메일 가입과 로그인

- `POST /auth/signup`: 인증 완료 증명과 `agreements`를 전달하고 `{ memberId }`를 검증합니다. 가입 후 자동 로그인하지 않습니다.
- `POST /auth/login/email`: 이메일·비밀번호와 `keepSignedIn: false`를 전달합니다. 서버는 현재 로그인 상태 유지 옵션을 지원하지 않으므로 실제 로그인 화면에서 체크박스를 숨깁니다.
- `GET /auth/me`: Bearer Access Token으로 사용자 이름과 이메일을 조회합니다. 화면에 표시할 사용자는 이 응답에서 가져옵니다.

Access Token은 메모리에만 보관합니다. Refresh Token은 서버가 설정한 HttpOnly 쿠키로 관리하며 브라우저 저장소에 복사하지 않습니다. 새로고침 시 아래 갱신 흐름으로 사용자 세션을 복구합니다.

#### 토큰 갱신과 로그아웃

- `GET /auth/csrf`: `credentials: include`로 호출해 응답의 마스킹된 CSRF 토큰을 받습니다.
- `POST /auth/token/renew`: 같은 쿠키와 `X-CSRF-TOKEN` 헤더를 전달합니다. 동시 갱신은 한 요청으로 합치고, 401이 난 보호 요청은 새 Access Token으로 한 번만 다시 시도합니다.
- `POST /auth/logout`: 새 CSRF 값을 조회한 뒤 쿠키와 헤더를 전달합니다. 응답은 204이며 프론트의 토큰·사용자·분석 임시 상태와 조회 캐시를 비웁니다.

#### Google 로그인과 가입

Google Identity Services 버튼은 웹 Client ID가 설정되고 `google-auth` 및 `auth-session` capability가 활성화된 경우에만 렌더링합니다.

- `POST /auth/login/google`: Google ID Token과 CSRF 쿠키·헤더를 전달합니다. `LOGIN`이면 토큰을 저장한 뒤 `/auth/me`를 조회합니다. `SIGNUP_REQUIRED`이면 `signupToken`을 메모리에 보관하고 약관 동의 화면으로 이동합니다.
- `POST /auth/signup/google`: 가입 증명과 동의 상태를 전달합니다. 성공하면 자동 로그인 토큰을 받은 뒤 `/auth/me`를 조회합니다.

Google 신규 가입의 이메일·이름은 서버가 ID Token에서 확인한 정보를 사용하며, 이메일 가입 양식을 다시 요청하지 않습니다.

2026-11-19 배포 서버는 무효 ID Token에 `401 AUTH-0024`를 반환해 이전 `503 AUTH-0025` 설정 오류가 해소된 것을 확인했습니다. Vercel의 `VITE_GOOGLE_CLIENT_ID`는 Production과 Preview/develop 모두 서버에 등록한 웹 Client ID로 수정했습니다. 이 변경은 새 배포에서 적용됩니다. 실제 Google 계정 로그인·가입은 새 배포 후 브라우저에서 확인해야 합니다.

#### 아직 실제 연동하지 않는 기능

비밀번호 재설정·변경, 분석·결과·이슈 수정·내보내기·기록은 대응 API가 서버 `develop`에 머지되기 전까지 목업을 유지합니다. PDF 보고서 접수와 원본 삭제는 병합됐지만 분석 시작 API가 아직 없어 이번 연결 범위에서 제외합니다. DOCX·HWPX 접수도 이번 연결 범위에서 제외합니다. 직접 입력은 MVP에서 제외합니다.

## 미연동 Mock 계약

아래 기능은 화면 개발을 위한 Mock 계약이며 서버 `develop`에 API가 머지되기 전까지 실제 호출하지 않습니다.

### 분석 생성

`POST /analyses` · `multipart/form-data`

- `file`: 분석할 보고서 파일 (필수)
- `documentType`: 문서 유형

응답: `{ "analysisId": "string" }`

### 진행 상태

`GET /analyses/:id`

```json
{
  "status": "processing",
  "progress": 48,
  "step": "규정",
  "title": "갯벌축제 계획 보고서",
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

이슈는 `sectionId`와 `location`을 선택값으로 전달합니다. 두 값이 없는 문서 전체 이슈는 목록과 목차의 최상단에 표시합니다. 상세 화면에 필요한 `checkArea`, `locationOrder`, `pendingReason`, `userChecks`, `suggestionAvailable`, `canRegenerate`, `appliedText`를 선택적으로 포함합니다. 근거 항목은 `source`, `quote` 외에 근거 유형 `type`과 원문 주소 `url`을 포함할 수 있습니다.

### 이슈 상태 변경

`PATCH /analyses/:analysisId/issues/:issueId`

요청은 사용자 행동에 따라 상태와 작업본 문장을 함께 전달합니다.

```json
{ "status": "resolved", "appliedText": "최종 적용 문장" }
```

`status`는 `open | resolved | ignored`입니다. 적용 취소는 `{ "status": "open" }`, 무시 해제도 `{ "status": "open" }`으로 요청합니다. 각 버튼 요청은 즉시 저장되며 별도의 일괄 저장 API는 사용하지 않습니다.

`POST /analyses/:analysisId/issues/:issueId/suggestion`은 다른 수정안 하나를 생성하고 `{ "suggestion": "string" }`을 반환합니다. 규칙에 따라 수정안이 고정된 이슈는 화면에서 요청 버튼을 비활성화합니다.

### 파일 내보내기

`POST /analyses/:analysisId/exports`

요청: `{ "kind": "document", "format": "PDF | DOCX | HWPX" }`

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
