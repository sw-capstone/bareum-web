import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Download, FileText, LoaderCircle, X } from 'lucide-react';
import type { AnalysisResult } from '../../types';
import type { DocumentFormat } from '../../services/exportApi';
import { useExport } from '../../hooks/useExport';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import { Button } from '../../components/ui';

type DownloadState = 'idle' | 'pending' | 'success' | 'error';

export function ExportMenu({ result }: { result: AnalysisResult }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<DocumentFormat>('PDF');
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const [progress, setProgress] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const progressTimer = useRef<number | null>(null);
  const exporter = useExport();
  const isPending = downloadState === 'pending';

  const stopProgress = useCallback(() => {
    if (progressTimer.current !== null) {
      window.clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  }, []);

  const close = useCallback(() => {
    if (!isPending) setOpen(false);
  }, [isPending]);

  useOutsideClick(menuRef, close);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [close, open]);

  useEffect(() => stopProgress, [stopProgress]);

  async function download() {
    stopProgress();
    setDownloadState('pending');
    setProgress(8);
    progressTimer.current = window.setInterval(() => {
      setProgress((current) => Math.min(92, current + Math.max(2, Math.round((96 - current) / 7))));
    }, 180);

    try {
      await Promise.all([
        exporter.mutateAsync({ format, result }),
        new Promise((resolve) => window.setTimeout(resolve, 700)),
      ]);
      stopProgress();
      setProgress(100);
      setDownloadState('success');
    } catch {
      stopProgress();
      setDownloadState('error');
    }
  }

  return (
    <div className="export-menu" ref={menuRef}>
      <Button
        size="sm"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
          if (!open) {
            setDownloadState('idle');
            setProgress(0);
          }
        }}
      >
        <Download />
        내보내기
      </Button>

      {open && (
        <section className="export-popover" role="dialog" aria-label="내보내기 메뉴">
          <div className="export-popover__head">
            <div>
              <span>EXPORT</span>
              <h2>내보내기</h2>
            </div>
            <button
              type="button"
              aria-label="내보내기 메뉴 닫기"
              onClick={close}
              disabled={isPending}
            >
              <X />
            </button>
          </div>
          <div className="export-popover__body">
            <label className="export-format">
              <span>파일 형식</span>
              <select
                value={format}
                onChange={(event) => {
                  setFormat(event.target.value as DocumentFormat);
                  setDownloadState('idle');
                  setProgress(0);
                }}
                disabled={isPending}
              >
                <option>PDF</option>
                <option>DOCX</option>
                <option>HWPX</option>
              </select>
            </label>
            <div className="export-file">
              <span className="export-file__icon">
                <FileText />
              </span>
              <div>
                <strong>{result.title}</strong>
                <p>수정 반영 문서 · {format}</p>
              </div>
            </div>
          </div>
          <div className="export-popover__footer">
            <Button onClick={download} disabled={isPending}>
              {isPending ? <LoaderCircle className="export-spinner" /> : <Download />}
              {isPending ? '다운로드 중' : '다운로드'}
            </Button>
            {downloadState !== 'idle' && (
              <div
                className={`export-progress export-progress--${downloadState}`}
                role={downloadState === 'error' ? 'alert' : 'status'}
              >
                <div className="export-progress__label">
                  <span>
                    {downloadState === 'pending' && <LoaderCircle className="export-spinner" />}
                    {downloadState === 'success' && <Check />}
                    {downloadState === 'error' && <X />}
                  </span>
                  <div>
                    <strong>
                      {downloadState === 'pending' && '파일을 준비하고 있습니다'}
                      {downloadState === 'success' && '다운로드가 완료되었습니다'}
                      {downloadState === 'error' && '파일을 생성하지 못했습니다'}
                    </strong>
                    <small>
                      {downloadState === 'error'
                        ? '잠시 후 다시 시도해 주세요.'
                        : `수정 반영 문서 · ${format}`}
                    </small>
                  </div>
                  {downloadState !== 'error' && <b>{progress}%</b>}
                </div>
                {downloadState !== 'error' && (
                  <div
                    className="export-progress__track"
                    role="progressbar"
                    aria-label="다운로드 진행률"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                  >
                    <i style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
