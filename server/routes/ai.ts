import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/ai/summarize
// Body: { commitMessage: string, diff: string }
// 응답: SSE 스트리밍 텍스트
router.post('/summarize', async (req: Request, res: Response) => {
  const { commitMessage, diff } = req.body as { commitMessage: string; diff: string };

  if (!commitMessage || !diff) {
    return res.status(400).json({ error: 'commitMessage와 diff가 필요합니다.' });
  }

  const prompt = `다음 GitHub 커밋 내용을 개발 블로그 포스트 초안으로 변환해줘.

커밋 메시지: ${commitMessage}

변경 내용(diff):
${diff}

요구사항:
- 한국어로 작성
- 변경 이유와 핵심 내용을 중심으로 설명
- 개발자 독자를 대상으로 작성
- 200자 내외`;

  try {
    const response = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    // SSE 헤더 설정
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return res.status(500).json({ error: '스트림을 읽을 수 없습니다.' });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

      for (const line of lines) {
        const data = line.replace('data: ', '');
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n');
          break;
        }
        try {
          const parsed = JSON.parse(data) as { choices: { delta: { content?: string } }[] };
          const content = parsed.choices[0]?.delta?.content;
          if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
        } catch {
          // 파싱 불가 청크는 무시
        }
      }
    }

    res.end();
  } catch (err) {
    res.status(500).json({ error: 'LLM API 요청 실패' });
  }
});

export default router;
