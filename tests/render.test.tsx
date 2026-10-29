import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CourseView } from '../src/components/Lesson/CourseView';
import { ExercisePlayer } from '../src/components/Lesson/ExercisePlayer';
import { expeditions } from '../src/content/expeditions';
import { lessons } from '../src/content/lessons';

/**
 * Fumée de rendu : chaque cours (visuels intégrés compris) et chaque
 * exercice se rendent sans exception côté serveur. Les effets (canvas,
 * animations) ne tournent pas ici : ce test attrape les erreurs du
 * renderer d'équations et des composants au premier rendu.
 */
const noop = () => {};

describe('rendu de tout le parcours', () => {
  for (const lesson of lessons) {
    it(`${lesson.id} : cours et exercices`, () => {
      if (lesson.course) {
        const html = renderToString(createElement(CourseView, { blocks: lesson.course }));
        expect(html.length).toBeGreaterThan(0);
      }
      for (const exercise of lesson.exercises) {
        const html = renderToString(createElement(ExercisePlayer, { exercise, onSuccess: noop }));
        expect(html).toContain('exercise');
      }
    });
  }
  for (const exp of expeditions) {
    it(`${exp.id} : étapes`, () => {
      for (const step of exp.steps) {
        renderToString(createElement(ExercisePlayer, { exercise: step.exercise, onSuccess: noop }));
      }
    });
  }
});

describe('MathText', () => {
  it('rend le gras, l’italique et le LaTeX sans laisser d’astérisques', async () => {
    const { MathText } = await import('../src/components/Lesson/CourseView');
    const html = renderToString(createElement(MathText, { text: 'Le *Kitab* et **al-jabr** : $x^2$' }));
    expect(html).toContain('<em>Kitab</em>');
    expect(html).toContain('<strong>al-jabr</strong>');
    expect(html).toContain('katex');
    expect(html).not.toContain('*');
  });
});
