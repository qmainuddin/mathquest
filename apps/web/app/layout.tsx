import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MathQuest — Exciting Math Adventures for Kids',
  description: 'Puzzle-based mathematics learning for children ages 7–11. Safe, private, and deterministic.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 text-xl font-bold text-indigo-600 focus:rounded-md">
              <span className="text-2xl">✨</span>
              <span>MathQuest</span>
            </a>
            <nav className="flex items-center gap-4">
              <a
                href="/dashboard"
                className="text-sm font-medium text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Guardian Dashboard
              </a>
              <a
                href="/login"
                className="text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Sign In
              </a>
            </nav>
          </div>
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} MathQuest. Safe, ad-free, child-privacy first (COPPA & GDPR-K compliant).</p>
            <div className="flex gap-4 text-xs">
              <span className="text-slate-400">Strict Server-Side Grading</span>
              <span>•</span>
              <span className="text-slate-400">Zero Commercial Tracking</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
