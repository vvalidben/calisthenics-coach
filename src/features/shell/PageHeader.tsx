import type { ReactNode } from 'react';

interface PageHeaderProps {
  /** Small caps above the title: where you are, or what the page counts. */
  kicker: ReactNode;
  title: string;
  /** A numeral or letter, set huge and hollow behind the title. */
  watermark?: string;
  children?: ReactNode;
}

/**
 * The head of a screen, as the design draws every one of them: a kicker in
 * small gold caps, a display title, and a hollow numeral bled off the corner
 * behind it.
 *
 * The watermark is decoration and is hidden from assistive technology — it
 * repeats something the kicker has already said in words.
 */
export const PageHeader = ({ kicker, title, watermark, children }: PageHeaderProps) => (
  <header className="page-head">
    {watermark !== undefined && (
      <span className="ghost" aria-hidden="true">
        {watermark}
      </span>
    )}
    <p className="page-head__kicker">{kicker}</p>
    <h1 className="page__title">{title}</h1>
    {children}
  </header>
);
