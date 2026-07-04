/**
 * Vérifie que tout le LaTeX des cours (blocs math + segments $...$) compile
 * via KaTeX avec throwOnError.
 *
 *   npx tsx scripts/verify-latex.ts
 */
import katex from 'katex';
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
  }
}
console.log(fail === 0 ? `${count} extraits LaTeX valides ✓` : `${fail}/${count} extraits en erreur`);
process.exit(fail === 0 ? 0 : 1);
