import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import githubRouter from './routes/github';
import aiRouter from './routes/ai';
import postsRouter from './routes/posts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.use('/api/github', githubRouter);
app.use('/api/ai', aiRouter);
app.use('/api/posts', postsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
