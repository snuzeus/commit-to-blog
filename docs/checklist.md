작성하신 claude.md를 기반으로 생성한 **[개발 마일스톤 및 체크리스트]**입니다.

## Phase 1: 인프라 및 전역 상태

### 공통
- [ ] `types/index.ts` — GitHubUser, Repository, Branch, Commit, Post 도메인 타입 정의 (High)
- [ ] `app/layout.tsx` — 전역 레이아웃 (Header, Footer, QueryClientProvider)

### Express 서버 초기화
- [ ] `server/index.ts` — Express 앱 진입점, CORS·JSON 미들웨어 설정 (High)
- [ ] `server/.env` 및 `.env.example` — `GITHUB_TOKEN`, `LLM_API_KEY` 환경변수 구성, `.gitignore` 등록 확인 (High)
- [ ] `server/routes/github.ts` — GitHub API 프록시 라우트 기본 틀 (High)
- [ ] `server/routes/ai.ts` — LLM API 프록시 라우트 기본 틀 (High)
- [ ] `server/routes/posts.ts` — 포스트 CRUD 라우트 기본 틀

### Zustand 스토어
- [ ] `stores/useAuthStore.ts` — user, accessToken, login/logout (High)
- [ ] `stores/useCommitStore.ts` — selectedRepo/Branch/Commit, generatedSummary, isSummaryStreaming (High)

## Phase 2: 기능 구현

### 공통 UI 컴포넌트
- [ ] `components/ui/Button.tsx` — 로딩 상태(`aria-busy`, `Loader2`) 포함 버튼 컴포넌트
- [ ] `components/ui/Badge.tsx` — 브랜치 뱃지 (main/feature/develop 컬러 분기)
- [ ] `components/ui/Card.tsx` — 카드 통일값 적용 (`rounded-xl border p-5 shadow-sm`)
- [ ] `components/ui/Skeleton.tsx` — CommitList(`h-16`×4) / AiSummaryBox(3줄) / PostCard(`h-40`+2줄) 프리셋
- [ ] `components/ui/Toast.tsx` — 성공·에러 토스트 컴포넌트
- [ ] `components/Header.tsx` — 네비게이션 탭(My Blog / Saved Posts / Settings) + `bg-gray-950` 헤더

### API 연동 (Express 서버)
- [ ] `server/routes/github.ts` — GitHub API 연동: 커밋 목록 (`GET /repos/:owner/:repo/commits`) (High)
- [ ] `server/routes/github.ts` — GitHub API 연동: 커밋 상세·diff (`GET /repos/:owner/:repo/commits/:sha`) (High)
- [ ] `server/routes/ai.ts` — LLM API 연동: 커밋 내용 + 프롬프트 → `POST /chat/completions` 스트리밍 요청 (High)
- [ ] `server/routes/ai.ts` — LLM 스트리밍 응답을 React Client로 청크 단위 전달 (SSE 또는 chunked response)
- [ ] API 키 노출 방지 검증 — `GITHUB_TOKEN`, `LLM_API_KEY`가 응답 페이로드에 포함되지 않는지 확인

### TanStack Query 훅 (React → Express 호출)
- [ ] `hooks/useRepositories.ts` — queryKey `['repos', searchQuery]`, staleTime 5m, Express `/github/repos` 호출 (High)
- [ ] `hooks/useCommits.ts` — queryKey `['commits', repo, branch]`, staleTime 2m, Express `/github/commits` 호출 (High)
- [ ] `hooks/usePosts.ts` — queryKey `['posts']`, CRUD mutations, 성공 시 `['posts']` invalidate (High)
- [ ] `hooks/useSavedPostsFilter.ts` — `usePosts` 파생 훅, searchQuery·activeBranch 클라이언트 필터링, URL 쿼리 파라미터 동기화

### 포스트 작성 화면 (`/my-blog`)
- [ ] `components/RepositoryPanel.tsx` — 좌측 패널 레이아웃 (`w-[360px] shrink-0 overflow-y-auto h-[calc(100vh-3.5rem)] border-r`) (High)
- [ ] `components/RepositoryPanel.tsx` — RepositorySearch 입력 + debounce 300ms + useRepositories 연동
- [ ] `components/RepositoryPanel.tsx` — BranchSelector 드롭다운 + 브랜치 선택 시 useCommits 실행
- [ ] `components/RepositoryPanel.tsx` — CommitList 최근 20개 렌더링 + CommitSearch 클라이언트 필터링
- [ ] `components/CommitDetailPanel.tsx` — 우측 패널 레이아웃 (`flex-1 min-w-0 overflow-y-auto`) (High)
- [ ] `components/CommitDetailPanel.tsx` — CommitItem 클릭 → `selectCommit()` → selectedCommit 구독, EmptyState 렌더링
- [ ] `components/CommitDetailPanel.tsx` — "요약 생성" 버튼 → `isSummaryStreaming = true` → POST /api/ai/summarize 스트리밍 수신 (High)
- [ ] `components/CommitDetailPanel.tsx` — AiSummaryBox 타이핑 커서(`|` animate-pulse) + 글자수 카운터 실시간 업데이트
- [ ] `components/CommitDetailPanel.tsx` — 스트리밍 완료 후 `editableContent` 로컬 상태로 직접 편집 전환
- [ ] `app/my-blog/page.tsx` — RepositoryPanel + CommitDetailPanel 2단 레이아웃 조립

### Context Logic 구현
- [ ] `CommitDetailPanel` — 스트리밍 중 `contentEditable={false}`, `aria-disabled="true"`, cursor `not-allowed` 처리
- [ ] `CommitDetailPanel` — 커밋 전환 시 `AbortController.abort()`로 진행 중 fetch 취소 + `setSummary(null)` 초기화 (High)
- [ ] `CommitDetailPanel` — 스트리밍 실패 시 부분 텍스트 유지 + 에러 토스트 + 재시도 버튼 노출

### 저장된 포스트 화면 (`/saved-posts`)
- [ ] `components/PostCard.tsx` — 카드 통일값 + BranchTag + 썸네일 + 제목 + 요약 + 수정/발행 버튼
- [ ] `components/PostCard.tsx` — 발행 버튼 `isPublishing` 로컬 상태 + `aria-busy="true" disabled` 처리
- [ ] `app/saved-posts/page.tsx` — PostCard 그리드(`gap-4`) + useSavedPostsFilter 연동 + URL 파라미터 필터 UI

### 디자인 시스템 적용
- [ ] 전역 포커스 스타일 — `outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2` (`globals.css` 또는 공통 클래스)
- [ ] 모바일 반응형 — `< md` 좌측 패널 숨김 + 슬라이드인 드로어 구현
- [ ] "저장 및 게시" 버튼 클릭 → useSavePost mutation → `['posts']` invalidate → `/saved-posts` 이동

## Phase 3: 품질 및 테스트

### 보안 점검

- [ ] `.env`가 `.gitignore`에 포함되어 있는지, `git status`로 추적되지 않는지 확인
- [ ] `server/.env.example`에 필요한 키 목록만 기재 (값은 비워둠)
- [ ] GitHub API / LLM API 응답에서 토큰이 클라이언트로 노출되지 않는지 확인

### 클린업 및 접근성
- [ ] `components/RepositoryPanel.tsx` — useEffect 클린업: debounce 타이머 `return () => clearTimeout(timer)`
- [ ] `components/CommitDetailPanel.tsx` — useEffect 클린업: 스트리밍 구독 `return () => subscription.unsubscribe()`
- [ ] A11y 점검 — 버튼 `<button type="button">`, 목록 `<ul>/<li>`, 카드 `<article>` 시맨틱 태그 확인
- [ ] A11y 점검 — AiSummaryBox `aria-live="polite"`, 로딩 버튼 전체 `aria-busy="true"` 확인
- [ ] `lib/format-commit.test.ts` — 커밋 메시지 파싱 단위 테스트
- [ ] `lib/validate-post.test.ts` — 포스트 저장 유효성 검사 단위 테스트
- [ ] `stores/useCommitStore.test.ts` — Zustand 스토어 액션 및 상태 전이 단위 테스트
- [ ] `__tests__/commit-to-summary.test.tsx` — 커밋 선택 → 요약 생성 플로우 통합 테스트
- [ ] `__tests__/save-post.test.tsx` — 저장·발행 버튼 인터랙션 통합 테스트
