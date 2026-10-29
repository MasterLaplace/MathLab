import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useState } from 'react';
import type { CourseBlock } from '../../content/schema';
import { SimView } from './SimView';
import './course.css';

function renderLatex(latex: string, displayMode: boolean): string {
  return katex.renderToString(latex, { displayMode, throwOnError: false, output: 'html' });
}

/** `**gras**` → <strong>, puis `*italique*` → <em>, dans un segment de texte brut. */
function boldSpans(text: string, keyBase: string) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={`${keyBase}-${i}`}>{part}</strong> : italicSpans(part, `${keyBase}-${i}`),
  );
}

function italicSpans(text: string, keyBase: string) {
  const parts = text.split(/\*([^*\n]+)\*/g);
  return parts.map((part, i) => (i % 2 === 1 ? <em key={`${keyBase}-${i}`}>{part}</em> : part));
}

/**
 * Texte avec segments `$...$` rendus en LaTeX inline et `**gras**`.
 * Tout le contenu pédagogique passe par ici : c'est ce qui rend les cours lisibles.
 */
export function MathText({ text }: { text: string }) {
  const parts = text.split(/\$([^$]+)\$/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} dangerouslySetInnerHTML={{ __html: renderLatex(part, false) }} />
        ) : (
          <span key={i}>{boldSpans(part, String(i))}</span>
        ),
      )}
    </>
  );
}

const CALLOUT_META = {
  idea: { icon: '💡', label: 'Intuition' },
  warn: { icon: '⚠️', label: 'Piège classique' },
  story: { icon: '📜', label: 'Histoire' },
  analogy: { icon: '🎭', label: 'Analogie' },
} as const;

/**
 * « Devine d'abord » : l'élève s'engage sur une réponse avant la
 * révélation. Une mauvaise réponse n'est jamais rouge : elle débloque
 * l'explication, exactement comme une bonne.
 */
function PredictBlock({ block }: { block: Extract<CourseBlock, { kind: 'predict' }> }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const revealed = chosen !== null;
  return (
    <div className="course-predict">
      <span className="course-predict-label">🤔 Devine d’abord</span>
      <p className="course-predict-q">
        <MathText text={block.question} />
      </p>
      <div className="course-predict-choices">
        {block.choices.map((choice, i) => {
          const state = !revealed
            ? ''
            : i === block.answer
              ? 'course-predict-right'
              : i === chosen
                ? 'course-predict-tried'
                : 'course-predict-other';
          return (
            <button
              type="button"
              key={i}
              className={`course-predict-choice ${state}`}
              disabled={revealed}
              onClick={() => setChosen(i)}
            >
              <MathText text={choice} />
            </button>
          );
        })}
      </div>
      {revealed && (
        <p className="course-predict-explain">
          <strong>{chosen === block.answer ? 'Bien vu ! ' : 'Intéressant — et c’est justement le piège. '}</strong>
          <MathText text={block.explain} />
        </p>
      )}
    </div>
  );
}

/** Rend le cours riche d'une leçon (paragraphes, équations, exemples, encadrés). */
export function CourseView({ blocks }: { blocks: CourseBlock[] }) {
  return (
    <div className="course">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'p':
            return (
              <p key={i} className="course-p">
                <MathText text={block.text} />
              </p>
            );
          case 'math':
            return (
              <figure key={i} className="course-math">
                <div
                  className="course-math-eq"
                  dangerouslySetInnerHTML={{ __html: renderLatex(block.latex, true) }}
                />
                {block.caption && (
                  <figcaption>
                    <MathText text={block.caption} />
                  </figcaption>
                )}
              </figure>
            );
          case 'example':
            return (
              <div key={i} className="course-example">
                <span className="course-example-title">✏️ {block.title ?? 'Exemple'}</span>
                <ol>
                  {block.steps.map((step, j) => (
                    <li key={j}>
                      <MathText text={step} />
                    </li>
                  ))}
                </ol>
              </div>
            );
          case 'sim':
            return (
              <figure key={i} className="course-sim">
                <SimView sim={block.sim} />
                {block.caption && (
                  <figcaption>
                    <MathText text={block.caption} />
                  </figcaption>
                )}
              </figure>
            );
          case 'predict':
            return <PredictBlock key={i} block={block} />;
          case 'callout': {
            const meta = CALLOUT_META[block.tone];
            return (
              <aside key={i} className={`course-callout course-callout-${block.tone}`}>
                <span className="course-callout-label">
                  {meta.icon} {meta.label}
                </span>
                <p>
                  <MathText text={block.text} />
                </p>
              </aside>
            );
          }
        }
      })}
    </div>
  );
}
