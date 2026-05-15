# commit-to-blog 구현 지침

GitHub 커밋을 AI 블로그 포스트로 변환하는 웹 애플리케이션

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 전역 상태 | Zustand |
| 서버 상태 | TanStack Query v5 |
| 스타일 | Tailwind CSS |
| 테스트 | Vitest + Testing Library |
| DB | Supabase (PostgreSQL) |
| DB 클라이언트 | supabase-js |
| 인증 | Supabase Auth |

## 폴더 구조

```
# Frontend (Next.js)
app/
├── my-blog/page.tsx           # 포스트 작성 [Client]
├── saved-posts/page.tsx       # 포스트 목록 [Server]
└── settings/page.tsx          # 설정 [추후 확정]
components/
├── ui/                        # Button, Badge, Card, Skeleton, Toast
├── Header.tsx
├── RepositoryPanel.tsx        # 저장소 검색 + 브랜치 + 커밋 목록 (좌측)
├── CommitDetailPanel.tsx      # 커밋 상세 + AI 요약 + 액션 버튼 (우측)
└── PostCard.tsx
hooks/
├── useRepositories.ts         # queryKey: ['repos', searchQuery], staleTime 5m
├── useCommits.ts              # queryKey: ['commits', repo, branch], staleTime 2m
└── usePosts.ts                # queryKey: ['posts'], CRUD mutations
stores/
├── useAuthStore.ts            # Supabase Auth 세션 (user, session)
└── useCommitStore.ts          # selectedRepo/Branch/Commit, generatedSummary
lib/
└── supabase.ts                # supabase-js 클라이언트 싱글턴
types/index.ts

# Backend (Express)
server/
├── index.ts                   # Express 앱 진입점 및 미들웨어 설정
├── routes/
│   ├── github.ts              # GitHub API 프록시 (커밋 목록·상세)
│   ├── ai.ts                  # LLM API 프록시 (chat/completions 스트리밍)
│   └── posts.ts               # 포스트 CRUD (Supabase DB 연동)
└── .env                       # API 토큰 보관 (커밋 제외)
```

## API 연동

**아키텍처 흐름**
```
Browser → React Client(Next.js) → Express Server → GitHub API  (커밋 목록·상세)
                                                 → LLM API     (chat/completions, 블로그 초안)
```

- React Client는 Express Server에만 HTTP 요청을 보낸다. GitHub/LLM API를 브라우저에서 직접 호출하지 않는다.
- Express Server가 외부 API의 프록시 역할을 담당한다 (라우팅·프록시).

**GitHub API**
- 호출 주체: Express Server (`server/routes/github.ts`)
- 제공 데이터: 커밋 목록, 커밋 상세(diff 포함)
- 인증: `Authorization: Bearer ${GITHUB_TOKEN}` 헤더

**LLM API**
- 호출 주체: Express Server (`server/routes/ai.ts`)
- 엔드포인트: `POST /chat/completions` (OpenAI 호환)
- 입력: 커밋 메시지 + diff + 블로그 변환 프롬프트
- 출력: 스트리밍 응답 → React Client로 전달

**Supabase (DB · 인증)**
- 클라이언트: `lib/supabase.ts`에 `createClient()` 싱글턴으로 관리
- 인증: Supabase Auth — `supabase.auth.signInWithOAuth({ provider: 'github' })` 활용
- 세션: `useAuthStore`에서 `supabase.auth.getSession()` 구독, user/session 저장
- DB: `server/routes/posts.ts`에서 supabase-js로 PostgreSQL 읽기·쓰기

**토큰 보안 규칙**
- `GITHUB_TOKEN`, `LLM_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` 등 모든 시크릿은 `server/.env`에 보관
- `.env`는 반드시 `.gitignore`에 포함, 커밋 금지
- `.env.example`을 커밋해 팀원이 필요한 키 목록을 알 수 있게 한다

## User Flow

```
1. [레포 선택]
   - RepositorySearch 입력 (debounce 300ms) → selectRepo() → useBranches 실행
   - 브랜치 선택 → selectBranch() → useCommits 실행

2. [커밋 조회]
   - CommitList 최근 20개 표시, CommitSearch로 message 기준 클라이언트 필터링
   - CommitItem 클릭 → selectCommit() → CommitDetailPanel 활성화

3. [AI 요약]
   - "요약 생성" 클릭 → isSummaryStreaming = true
   - POST /api/ai/summarize 스트리밍 수신 → AiSummaryBox 타이핑 효과 표시
   - 완료 → isSummaryStreaming = false, 편집 가능 전환

4. [편집 및 저장]
   - AiSummaryBox 직접 수정 (editableContent 로컬 상태)
   - "저장 및 게시" 클릭 → useSavePost mutation → ['posts'] invalidate → /saved-posts 이동
```

## Context Logic

**커밋 선택 → 우측 패널**
- CommitItem 클릭 → `selectCommit(commit)`, CommitDetailPanel은 `selectedCommit` 구독
- `selectedCommit === null`이면 EmptyState 렌더링
- 커밋 전환 시 `setSummary(null)`로 이전 요약 즉시 초기화

**스트리밍 중 편집 예외**
- 스트리밍 중 AiSummaryBox: `contentEditable={false}`, `aria-disabled="true"`, cursor `not-allowed`
- 스트리밍 중 다른 커밋 클릭: `AbortController.abort()`로 진행 중 fetch 취소 후 새 요약 시작
- 스트리밍 실패: 부분 수신 텍스트 유지 + 에러 토스트 + 재시도 버튼

**Saved Posts 필터**
- 클라이언트 사이드 필터링 (`useSavedPostsFilter` 훅, 별도 API 없음)
- 필터 기준: `searchQuery`(제목+본문), `activeBranch`(브랜치명 일치)
- 필터 상태를 URL 쿼리 파라미터(`?q=...&branch=...`)로 동기화

## State 규칙

- **Zustand**: 여러 컴포넌트가 공유하는 UI 상태 (인증, 커밋 선택, AI 요약 결과)
- **TanStack Query**: 서버 데이터 전담. queryKey는 `[도메인, ...파라미터]` 형태 유지
- **Mutation 성공 후 관련 queryKey 반드시 invalidate**: `useSavePost` → `['posts']`
- **Local useState**: 단일 컴포넌트 내 임시 상태만 (searchQuery, editableContent, isPublishing)

## Design System

**Layout**
- 좌측: `w-[360px] shrink-0 overflow-y-auto h-[calc(100vh-3.5rem)] border-r`
- 우측: `flex-1 min-w-0 overflow-y-auto h-[calc(100vh-3.5rem)]`
- 헤더: `fixed h-14 z-50`
- 모바일(`< md`): 좌측 패널 숨김, 슬라이드인 드로어로 전환

**테마 컬러**

| 용도 | Tailwind 클래스 |
|------|----------------|
| 헤더 배경 | `bg-gray-950` |
| 페이지 배경 | `bg-gray-50` |
| 패널·카드 배경 | `bg-white` |
| 보더 | `border-gray-200` |
| 주요 버튼 | `bg-gray-900 text-white` |
| 뱃지 main | `bg-green-100 text-green-800` |
| 뱃지 feature | `bg-blue-100 text-blue-800` |
| 뱃지 develop | `bg-purple-100 text-purple-800` |

**카드 통일값**: `rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-200` / 그리드 `gap-4`

**인터랙션 피드백**
- 로딩 버튼: `aria-busy="true" disabled` + `<Loader2 className="w-4 h-4 animate-spin mr-2" />`
- 스켈레톤: CommitList `h-16` × 4 / AiSummaryBox 텍스트 3줄(`h-4`, 100%·80%·60%) / PostCard `h-40` + 2줄
- 스트리밍 커서: `|` (`animate-pulse`) + 우측 하단 글자수 카운터 실시간 업데이트
- 포커스(전역): `outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`

## 필수 준수 규칙

**useEffect 클린업**
- 타이머: `return () => clearTimeout(timer)` (RepositorySearch debounce)
- 구독·스트리밍: `return () => subscription.unsubscribe()` (AiSummaryBox 스트리밍)

**A11y**
- 버튼 `<button type="button">`, 목록 `<ul>/<li>`, 카드 `<article>`
- 동적 콘텐츠 `aria-live="polite"`, 로딩 버튼 `aria-busy="true"`

**테스트**
- 단위: 커밋 메시지 파싱·유효성 검사·Zustand 스토어 액션 (`lib/*.test.ts`)
- 통합: 커밋 선택→요약 생성 플로우, 저장·발행 버튼 인터랙션 (`__tests__/`)

