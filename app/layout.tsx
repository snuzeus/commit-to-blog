import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'commit-to-blog',
  description: 'GitHub 커밋을 AI 블로그 포스트로 변환',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Providers>
          {/* Header는 components/Header.tsx 구현 후 추가 */}
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
