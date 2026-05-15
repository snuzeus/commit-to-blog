import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  return createClient(url, key);
}

// GET /api/posts?user_id=xxx
router.get('/', async (req: Request, res: Response) => {
  const { user_id } = req.query;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/posts
router.post('/', async (req: Request, res: Response) => {
  const supabase = getSupabase();
  const { user_id, repo, branch, commit_hash, title, content } = req.body as {
    user_id: string;
    repo: string;
    branch: string;
    commit_hash: string;
    title: string;
    content: string;
  };

  const { data, error } = await supabase
    .from('posts')
    .insert({ user_id, repo, branch, commit_hash, title, content, published: false })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/posts/:id
router.patch('/:id', async (req: Request, res: Response) => {
  const supabase = getSupabase();
  const { title, content } = req.body as { title?: string; content?: string };

  const { data, error } = await supabase
    .from('posts')
    .update({ title, content, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/posts/:id/publish
router.post('/:id/publish', async (req: Request, res: Response) => {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('posts')
    .update({ published: true })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
