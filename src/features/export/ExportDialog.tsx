import { useState } from 'react';
import { Download, FileText, X } from 'lucide-react';
import type { AnalysisResult } from '../../types';
import type { DocumentFormat, ExportKind } from '../../services/exportApi';
import { useExport } from '../../hooks/useExport';
import { Button, Modal } from '../../components/ui';
export function ExportDialog({
  result,
  onClose,
  initialKind = 'document',
}: {
  result: AnalysisResult;
  onClose: () => void;
  initialKind?: ExportKind;
}) {
  const [kind, setKind] = useState<ExportKind>(initialKind);
  const [format, setFormat] = useState<DocumentFormat>('PDF');
  const exporter = useExport();
  function download() {
    exporter.mutate({ kind, format, result });
  }
  return (
    <Modal label="내보내기" onClose={onClose}>
      <div className="export-head">
        <div>
          <h2>내보내기</h2>
          <p>출력할 문서와 형식을 선택하세요.</p>
        </div>
        <button aria-label="닫기" onClick={onClose}>
          <X />
        </button>
      </div>
      <div className="export-tabs" role="tablist" aria-label="출력 문서 선택">
        <button
          role="tab"
          aria-selected={kind === 'document'}
          className={kind === 'document' ? 'active' : ''}
          onClick={() => setKind('document')}
        >
          수정 반영 본문
        </button>
        <button
          role="tab"
          aria-selected={kind === 'report'}
          className={kind === 'report' ? 'active' : ''}
          onClick={() => setKind('report')}
        >
          분석 리포트 PDF
        </button>
      </div>
      {kind === 'document' && (
        <label className="select-field">
          <span>출력 형식</span>
          <select value={format} onChange={(e) => setFormat(e.target.value as DocumentFormat)}>
            <option>PDF</option>
            <option>DOCX</option>
            <option>HWPX</option>
          </select>
        </label>
      )}
      <div className="export-info">
        <FileText />
        <div>
          <strong>{kind === 'report' ? `${result.title} 품질 리포트` : result.title}</strong>
          <p>
            {kind === 'report'
              ? '분석 결과와 영역별 품질 점수를 PDF로 출력합니다.'
              : `수정 반영 본문 · ${format}`}
          </p>
        </div>
      </div>
      {exporter.isError && (
        <p className="export-error" role="alert">
          파일을 생성하지 못했습니다. 다시 시도해 주세요.
        </p>
      )}
      <div className="modal-actions">
        <Button onClick={download} disabled={exporter.isPending}>
          <Download />
          {exporter.isPending ? '생성 중…' : '다운로드'}
        </Button>
      </div>
    </Modal>
  );
}
