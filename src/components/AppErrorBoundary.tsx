import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui';
interface State {
  hasError: boolean;
}
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unexpected application error', error, info);
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="analysis-page">
        <p className="eyebrow">화면 오류</p>
        <h1>페이지를 표시하지 못했습니다</h1>
        <p>잠시 후 다시 시도해 주세요. 문제가 계속되면 담당자에게 문의해 주세요.</p>
        <Button onClick={() => window.location.reload()}>새로고침</Button>
      </main>
    );
  }
}
