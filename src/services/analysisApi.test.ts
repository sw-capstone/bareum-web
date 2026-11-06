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

describe('analysisApi document names', () => {
  it('분해된 한글 파일명을 분석 중 화면과 결과 화면에서 정상적으로 표시한다', async () => {
    const filename = '[결과] 경영지원팀_2021년 보고서.pdf';
    const file = new File(['보고서'], filename.normalize('NFD'), { type: 'application/pdf' });
    const { analysisId } = await analysisApi.start({ file, documentType: '계획 보고서' });

    expect((await analysisApi.getProgress(analysisId)).title).toBe(filename);
    const result = await analysisApi.getResult(analysisId);
    expect(result.title).toBe(filename);
    expect(result.filename).toBe(filename);
  });
});
