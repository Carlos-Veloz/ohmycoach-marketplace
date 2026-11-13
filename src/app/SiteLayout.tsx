import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router';

export function SiteLayout() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
      >
        {t('shell.skipToContent')}
      </a>
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
          <Link
            to="/"
            aria-label={t('app.homeLink')}
            className="flex items-baseline gap-2 font-semibold no-underline"
          >
            <span>{t('app.name')}</span>
            <span className="text-sm font-medium text-muted-foreground">
              {t('app.marketplace')}
            </span>
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground">
          {t('shell.footer')}
        </div>
      </footer>
    </div>
  );
}
