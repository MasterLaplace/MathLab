/**
 * Vérifie en headless que chaque exercice avec un `goal` est résoluble par
 * gestes : BFS sur legalMoves + reachesGoal, générateurs inclus.
 *
 *   npx tsx scripts/verify-lessons.ts             # toutes les leçons
 *   npx tsx scripts/verify-lessons.ts p11-poles…  # ids ciblés
 */
import { lessons } from '../src/content/lessons';
import { legalMoves } from '../src/core/rules';
import { reachesGoal } from '../src/core/engine';
import { normalize, isCall, type Expr, type Path } from '../src/core/ast';

function allPaths(expr: Expr, base: Path = []): Path[] {
  const paths: Path[] = [base];
  if (isCall(expr)) {
    for (let i = 1; i < expr.length; i++) {
      paths.push(...allPaths(expr[i] as Expr, [...base, i]));
    }
  }
  return paths;
}

function solve(start: Expr, goal: Expr, strict?: boolean, maxDepth = 8): string[] | null {
  const s0 = normalize(start);
  if (reachesGoal(s0, goal, strict)) return [];
  const seen = new Set<string>([JSON.stringify(s0)]);
  let frontier: { expr: Expr; steps: string[] }[] = [{ expr: s0, steps: [] }];
  for (let depth = 0; depth < maxDepth; depth++) {
    const next: typeof frontier = [];
    for (const { expr, steps } of frontier) {
      for (const path of allPaths(expr)) {
        for (const move of legalMoves(expr, path)) {
          const result = normalize(move.result);
          const key = JSON.stringify(result);
          if (seen.has(key)) continue;
          seen.add(key);
          const newSteps = [...steps, move.label];
          if (reachesGoal(result, goal, strict)) return newSteps;
          next.push({ expr: result, steps: newSteps });
        }
      }
    }
    frontier = next.slice(0, 3000);
    if (frontier.length === 0) break;
  }
  return null;
}

const wanted = new Set(process.argv.slice(2));
let fail = 0;
for (const lesson of lessons) {
  if (wanted.size > 0 && !wanted.has(lesson.id)) continue;
  for (const ex of lesson.exercises) {
    if (ex.goal === undefined) {
      console.log(`  ~ ${lesson.id}/${ex.id} : exploration libre`);
      continue;
    }
    const solution = solve(ex.start, ex.goal, ex.strictGoal);
    if (solution === null) {
      console.error(`  ✗ ${lesson.id}/${ex.id} : AUCUNE solution par gestes !`);
      fail++;
    } else {
      console.log(`  ✓ ${lesson.id}/${ex.id} : ${solution.length} geste(s)`);
    }
  }
  if (lesson.generator) {
    let genFail = 0;
    for (let i = 0; i < 5; i++) {
      const ex = lesson.generator();
      if (ex.goal === undefined) continue;
      if (solve(ex.start, ex.goal, ex.strictGoal) === null) {
        console.error(`  ✗ ${lesson.id}/generator#${i} : insoluble ! start=${JSON.stringify(ex.start)}`);
        genFail++;
      }
    }
    fail += genFail;
    if (genFail === 0) console.log(`  ✓ ${lesson.id}/generator : 5 tirages OK`);
  }
}
console.log(fail === 0 ? '\nTOUS LES EXERCICES SONT RÉSOLUBLES ✓' : `\n${fail} ÉCHEC(S)`);
process.exit(fail === 0 ? 0 : 1);
