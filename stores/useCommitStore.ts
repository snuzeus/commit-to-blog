import { create } from 'zustand';
import { Branch, Commit } from '@/types';

interface CommitStore {
  selectedRepo: string | null;
  selectedBranch: string;
  selectedCommit: Commit | null;
  generatedSummary: string | null;
  isSummaryStreaming: boolean;

  selectRepo: (repo: string) => void;
  selectBranch: (branch: string) => void;
  selectCommit: (commit: Commit) => void;
  setSummary: (summary: string | null) => void;
  appendSummary: (chunk: string) => void;
  setStreaming: (streaming: boolean) => void;
  clearSelection: () => void;
}

export const useCommitStore = create<CommitStore>((set) => ({
  selectedRepo: null,
  selectedBranch: 'main',
  selectedCommit: null,
  generatedSummary: null,
  isSummaryStreaming: false,

  selectRepo: (repo) =>
    set({ selectedRepo: repo, selectedBranch: 'main', selectedCommit: null, generatedSummary: null }),

  selectBranch: (branch) =>
    set({ selectedBranch: branch, selectedCommit: null, generatedSummary: null }),

  selectCommit: (commit) =>
    set({ selectedCommit: commit, generatedSummary: null, isSummaryStreaming: false }),

  setSummary: (summary) => set({ generatedSummary: summary }),

  // 스트리밍 청크를 기존 텍스트에 누적
  appendSummary: (chunk) =>
    set((state) => ({ generatedSummary: (state.generatedSummary ?? '') + chunk })),

  setStreaming: (streaming) => set({ isSummaryStreaming: streaming }),

  clearSelection: () =>
    set({ selectedCommit: null, generatedSummary: null, isSummaryStreaming: false }),
}));
