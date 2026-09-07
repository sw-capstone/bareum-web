export type Screen =
  'login' | 'upload' | 'analyzing' | 'failed' | 'dashboard' | 'report' | 'settings';
export type Severity = 'high' | 'medium' | 'low' | 'pending';
export type IssueStatus = 'open' | 'resolved' | 'ignored';
export interface User {
  name: string;
  email: string;
}
export interface Evidence {
  source: string;
  quote: string;
}
export interface Issue {
  id: string;
  level: Severity;
  status: IssueStatus;
  sectionId: string;
  section: string;
  title: string;
  summary: string;
  original: string;
  suggestion: string;
  explanation: string;
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
