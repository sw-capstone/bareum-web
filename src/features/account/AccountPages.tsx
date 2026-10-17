import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  FolderOpen,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Button, Modal } from '../../components/ui';
import type { AnalysisRecord, AnalysisReportFolder } from './recentAnalysis';

export function LoginManagementPage({ onBack }: { onBack: () => void }) {
  return (
    <main className="page account-page">
      <div className="page-heading">
        <h1>구글 로그인 관리</h1>
        <p>바름에 연결된 로그인 계정을 확인하고 관리합니다.</p>
      </div>
      <section className="upload-card account-card">
        <div className="account-provider-icon">
          <ShieldCheck />
        </div>
        <div>
          <h2>Google 계정 연결됨</h2>
          <p>현재 계정은 Google 로그인을 사용하고 있습니다.</p>
        </div>
        <Button size="sm" variant="secondary">
          <ExternalLink /> Google에서 관리
        </Button>
      </section>
      <Button variant="tertiary" onClick={onBack}>
        이전 화면으로
      </Button>
    </main>
  );
}

export function AnalysisHistoryPage({
  folders,
  onOpen,
  onDelete,
}: {
  folders: AnalysisReportFolder[];
  onOpen: (folder: AnalysisReportFolder) => void;
  onDelete: (folder: AnalysisReportFolder) => void;
}) {
  const [query, setQuery] = useState('');
  const [pendingDelete, setPendingDelete] = useState<AnalysisReportFolder | null>(null);
  const filteredFolders = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('ko-KR');
    if (!keyword) return folders;
    return folders.filter((folder) =>
      `${folder.title} ${folder.filename}`.toLocaleLowerCase('ko-KR').includes(keyword),
    );
  }, [folders, query]);

  return (
    <main className="page account-page history-page">
      <div className="page-heading history-heading">
        <div>
          <h1>내 분석 기록</h1>
        </div>
        <label className="history-search">
          <Search aria-hidden="true" />
          <span className="sr-only">보고서 검색</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="보고서명 또는 파일명 검색"
          />
        </label>
      </div>
      <section className="history-surface" aria-live="polite">
        {filteredFolders.length ? (
          <div className="history-grid">
            {filteredFolders.map((folder) => (
              <article className="history-folder" key={folder.id}>
                <button
                  className="history-delete"
                  aria-label={`${folder.title} 기록 삭제`}
                  onClick={() => setPendingDelete(folder)}
                >
                  <Trash2 />
                </button>
                <button className="history-folder-main" onClick={() => onOpen(folder)}>
                  <span className="history-folder-preview">
                    <FileText />
                    <span>BAREUM</span>
                  </span>
                  <span className="history-folder-copy">
                    <strong>{folder.title}</strong>
                    <small>{folder.filename}</small>
                    <span>
                      <FolderOpen /> 분석 기록 {folder.records.length}건
                    </span>
                  </span>
                  <b>기록 열기</b>
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="history-empty">
            {query ? <Search /> : <Clock3 />}
            <h2>{query ? '검색 결과가 없습니다' : '아직 저장된 분석 기록이 없습니다'}</h2>
            <p>
              {query
                ? '다른 보고서명이나 파일명으로 검색해 주세요.'
                : '분석 결과에서 수정 끝내기를 완료하면 이곳에 기록됩니다.'}
            </p>
          </div>
        )}
      </section>
      {pendingDelete && (
        <DeleteHistoryModal
          title="보고서 기록을 삭제하시겠습니까?"
          description="이 보고서에 저장된 모든 분석 기록이 삭제되며 복구할 수 없습니다."
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            onDelete(pendingDelete);
            setPendingDelete(null);
          }}
        />
      )}
    </main>
  );
}

export function ReportAnalysisHistoryPage({
  folder,
  onBack,
  onDelete,
}: {
  folder: AnalysisReportFolder;
  onBack: () => void;
  onDelete: (record: AnalysisRecord) => void;
}) {
  const [pendingDelete, setPendingDelete] = useState<AnalysisRecord | null>(null);
  return (
    <main className="page account-page history-page">
      <button className="history-back" onClick={onBack}>
        <ArrowLeft /> 보고서 목록으로
      </button>
      <div className="page-heading history-detail-heading">
        <div>
          <h1>{folder.title}</h1>
        </div>
      </div>
      <section className="history-surface">
        {folder.records.length ? (
          <div className="history-grid history-record-grid">
            {folder.records.map((record, index) => (
              <article className="history-folder history-record" key={record.id}>
                <button
                  className="history-delete"
                  aria-label={`${formatHistoryDate(record.completedAt)} 분석 기록 삭제`}
                  onClick={() => setPendingDelete(record)}
                >
                  <Trash2 />
                </button>
                <div className="history-folder-main history-record-main">
                  <span className="history-folder-preview">
                    <FileCheck2 />
                    <span>RESULT {String(folder.records.length - index).padStart(2, '0')}</span>
                  </span>
                  <span className="history-folder-copy">
                    <strong>{formatHistoryDate(record.completedAt)}</strong>
                    <small>{formatHistoryTime(record.completedAt)} 저장</small>
                    <span>
                      <CheckCircle2 /> 결과 리포트 저장 완료
                    </span>
                  </span>
                  <b>저장된 결과 보고서</b>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="history-empty">
            <CalendarDays />
            <h2>남아 있는 분석 기록이 없습니다</h2>
            <p>보고서 목록으로 돌아가 다른 보고서 기록을 확인해 주세요.</p>
          </div>
        )}
      </section>
      {pendingDelete && (
        <DeleteHistoryModal
          title="분석 기록을 삭제하시겠습니까?"
          description="선택한 분석 기록은 삭제 후 복구할 수 없습니다."
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            onDelete(pendingDelete);
            setPendingDelete(null);
          }}
        />
      )}
    </main>
  );
}

function DeleteHistoryModal({
  title,
  description,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal label={title} onClose={onClose} className="history-delete-modal">
      <div className="history-delete-message">
        <span>
          <AlertTriangle />
        </span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="modal-footer">
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          <Trash2 /> 삭제하기
        </Button>
      </div>
    </Modal>
  );
}

function formatHistoryDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}

function formatHistoryTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(value),
  );
}
