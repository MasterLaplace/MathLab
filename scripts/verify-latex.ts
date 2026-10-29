/**
 * Vérifie que tout le LaTeX des cours (blocs math + segments $...$) compile
 * via KaTeX avec throwOnError.
 *
 *   npx tsx scripts/verify-latex.ts
 */
import katex from 'katex';
import { expeditions } from '../src/content/expeditions';
import { lessons } from '../src/content/lessons';
import type { CourseBlock } from '../src/content/schema';

let fail = 0;
let count = 0;

function check(latex: string, where: string, display: boolean) {
  count++;
  try {
    katex.renderToString(latex, { displayMode: display, throwOnError: true });
  } catch (err) {
    fail++;
    console.error(`  ✗ ${where} : ${latex}\n    ${(err as Error).message}`);
  }
}

function checkText(text: string, where: string) {
  const parts = text.split(/\$([^$]+)\$/g);
  for (let i = 1; i < parts.length; i += 2) check(parts[i], where, false);
}

for (const lesson of lessons) {
  for (const [i, p] of lesson.intro.entries()) checkText(p, `${lesson.id}/intro[${i}]`);
  for (const [i, block] of (lesson.course ?? ([] as CourseBlock[])).entries()) {
    const where = `${lesson.id}/course[${i}]`;
    if (block.kind === 'p' || block.kind === 'callout') checkText(block.text, where);
    if (block.kind === 'math') {
      check(block.latex, where, true);
      if (block.caption) checkText(block.caption, where + '/caption');
    }
    if (block.kind === 'example') for (const s of block.steps) checkText(s, where);
    if (block.kind === 'sim' && block.caption) checkText(block.caption, where + '/caption');
    if (block.kind === 'predict') {
      checkText(block.question, where + '/question');
      for (const c of block.choices) checkText(c, where + '/choice');
      checkText(block.explain, where + '/explain');
      if (block.answer < 0 || block.answer >= block.choices.length) {
        fail++;
        console.error(`  ✗ ${where} : réponse ${block.answer} hors des choix`);
      }
    }
  }
  // Les consignes, indices et invites des exercices passent aussi par KaTeX.
  for (const ex of lesson.exercises) {
    checkText(ex.prompt, `${lesson.id}/${ex.id}/prompt`);
    for (const h of ex.hints ?? (ex.hint ? [ex.hint] : [])) checkText(h, `${lesson.id}/${ex.id}/hint`);
  }
}
for (const exp of expeditions) {
  for (const [i, p] of exp.story.entries()) checkText(p, `${exp.id}/story[${i}]`);
  for (const [i, step] of exp.steps.entries()) checkText(step.intro, `${exp.id}/step[${i}]`);
  checkText(exp.epilogue, `${exp.id}/epilogue`);
}
console.log(fail === 0 ? `${count} extraits LaTeX valides ✓` : `${fail}/${count} extraits en erreur`);
process.exit(fail === 0 ? 0 : 1);
