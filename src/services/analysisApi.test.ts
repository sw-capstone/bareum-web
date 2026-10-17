import { describe, expect, it } from 'vitest';
import { analysisApi } from './analysisApi';

describe('analysisApi mock pause/resume', () => {
  it('취소 확인 중에는 진행률을 멈추고 닫으면 다시 진행한다', async () => {
    const { analysisId } = await analysisApi.start({
      text: '분석할 보고서',
      documentType: '계획 보고서',
    });
    const beforePause = await analysisApi.getProgress(analysisId);

    await analysisApi.pause(analysisId);
    const paused = await analysisApi.getProgress(analysisId);
    const stillPaused = await analysisApi.getProgress(analysisId);

    expect(paused.status).toBe('paused');
    expect(paused.progress).toBe(beforePause.progress);
    expect(stillPaused.progress).toBe(beforePause.progress);

    await analysisApi.resume(analysisId);
    const resumed = await analysisApi.getProgress(analysisId);

    expect(resumed.status).toBe('processing');
    expect(resumed.progress).toBeGreaterThan(beforePause.progress);
  });
});
