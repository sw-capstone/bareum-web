import { env } from '../config/env';
import type { AnalysisResult } from '../types';
export type ExportKind = 'document' | 'report';
export type DocumentFormat = 'PDF' | 'DOCX' | 'HWPX';
export interface ExportRequest {
  kind: ExportKind;
  format: DocumentFormat;
  result: AnalysisResult;
}
export const exportApi = {
  async download({ kind, format, result }: ExportRequest) {
    if (!env.useMockApi) {
      const response = await fetch(`${env.apiBaseUrl}/analyses/${result.id}/exports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, format }),
      });
      if (!response.ok) throw new Error('내보내기 파일을 생성하지 못했습니다.');
      return {
        blob: await response.blob(),
        filename: decodeURIComponent(
          response.headers.get('x-filename') ?? `${result.title}.${format.toLowerCase()}`,
        ),
      };
    }
    const content =
      kind === 'report'
        ? `BAREUM 품질 리포트\n문서: ${result.title}\n품질 점수: ${result.score}점\n등급: ${result.grade}\n이슈: ${result.issues.length}건`
        : `${result.title}\n\n${result.sections.map((section) => `${section.number}. ${section.title}\n${section.paragraphs.map((paragraph) => paragraph.map((segment) => segment.text).join('')).join('\n')}`).join('\n\n')}`;
    return {
      blob: new Blob([content], { type: 'text/plain;charset=utf-8' }),
      filename: `${result.title}-${kind === 'report' ? '품질리포트' : '수정본'}.txt`,
    };
  },
};
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
