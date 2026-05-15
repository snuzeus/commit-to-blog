import { Router, Request, Response } from 'express';

const router = Router();
const GITHUB_API = 'https://api.github.com';

function githubHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

// GET /api/github/repos?q=searchQuery
router.get('/repos', async (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q) return res.json([]);

  try {
    const response = await fetch(`${GITHUB_API}/search/repositories?q=${encodeURIComponent(q)}&per_page=10`, {
      headers: githubHeaders(),
    });
    const data = await response.json() as { items: unknown[] };
    res.json(data.items ?? []);
  } catch (err) {
    res.status(500).json({ error: 'GitHub API 요청 실패' });
  }
});

// GET /api/github/repos/:owner/:repo/branches
router.get('/repos/:owner/:repo/branches', async (req: Request, res: Response) => {
  const { owner, repo } = req.params;

  try {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/branches`, {
      headers: githubHeaders(),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'GitHub API 요청 실패' });
  }
});

// GET /api/github/repos/:owner/:repo/commits?branch=main
router.get('/repos/:owner/:repo/commits', async (req: Request, res: Response) => {
  const { owner, repo } = req.params;
  const branch = (req.query.branch as string) ?? 'main';

  try {
    const response = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/commits?sha=${branch}&per_page=20`,
      { headers: githubHeaders() }
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'GitHub API 요청 실패' });
  }
});

// GET /api/github/repos/:owner/:repo/commits/:sha
router.get('/repos/:owner/:repo/commits/:sha', async (req: Request, res: Response) => {
  const { owner, repo, sha } = req.params;

  try {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits/${sha}`, {
      headers: githubHeaders(),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'GitHub API 요청 실패' });
  }
});

export default router;
