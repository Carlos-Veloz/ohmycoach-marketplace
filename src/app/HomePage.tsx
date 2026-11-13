import { useTranslation } from 'react-i18next';

export function HomePage() {
  const { t } = useTranslation();
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">{t('home.title')}</h1>
      <p className="max-w-prose text-muted-foreground">{t('home.description')}</p>
      <p className="text-muted-foreground">{t('home.comingSoon')}</p>
    </section>
  );
}
