# bareum-web 지침

- 이 레포는 화면·사용자 입력·공개 API 소비를 담당한다.
- `bareum-server`의 DB, AI 내부 모듈, 하네스 구현을 직접 참조하지 않는다.
- API 응답은 `src/services/contracts.ts`에서 런타임 검증한다.
- 서버 계약이 담당자에 의해 확정되면 `docs/backend-integration.md`와 프론트 소비 코드를 함께 검토한다.
- 프론트엔드 품질 검사는 `npm run check`를 사용한다.
- 공유 브랜치에 강제 푸시하지 않고 PR에서 변경 목적·검증 결과·남은 위험을 기록한다.
