export type Screen = 'login' | 'upload' | 'analyzing' | 'failed' | 'dashboard' | 'settings';
export type Severity = 'high' | 'medium' | 'low' | 'pending';
export type IssueStatus = 'open' | 'resolved' | 'ignored';
export interface User {
  name: string;
  email: string;
}
export interface Evidence {
  source: string;
  quote: string;
  type?: '법령' | '자치법규' | '행정규칙' | '지침' | '상위계획' | '정책' | '공문' | '방침' | '기타';
  url?: string;
}
export interface Issue {
  id: string;
  level: Severity;
  status: IssueStatus;
  sectionId?: string;
  section: string;
  location?: string;
  locationOrder?: number;
  checkArea?: string;
  title: string;
  summary: string;
  original: string;
  suggestion: string;
  appliedText?: string | null;
  suggestionAvailable?: boolean;
  canRegenerate?: boolean;
  explanation: string;
  pendingReason?: string;
  userChecks?: string[];
  evidence: Evidence[];
}
export interface Segment {
  text: string;
  issueId?: string;
  level?: Severity;
}
export interface DocSection {
  id: string;
  number: number;
  title: string;
  paragraphs: Segment[][];
}
export interface AnalysisResult {
  id: string;
  title: string;
  filename: string;
  reviewedAt: string;
  score: number;
  grade: string;
  sections: DocSection[];
  issues: Issue[];
}
