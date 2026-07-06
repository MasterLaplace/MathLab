import { useEffect, useMemo, useState } from 'react';
import { ExercisePlayer } from '../components/Lesson/ExercisePlayer';
import { lessons } from '../content/lessons';
import {
  type QuestState,
  dailyChallenges,
  isQuestDone,
  loadQuest,
  recordQuestDone,
  todayKey,
} from '../core/quest';

interface QuestProps {
  onBack: () => void;
}

/**
 * Le Défi du jour (station Z) : 5 exercices tirés dans tout le parcours,
 * un par phase autant que possible, en mode examen — aucun indice.
 * Même jour = même défi pour tout le monde ; la série se construit
 * un jour après l'autre, comme la révision espacée l'exige.
 */
export function Quest({ onBack }: QuestProps) {
  const dateKey = todayKey();
  const challenges = useMemo(() => dailyChallenges(lessons, dateKey), [dateKey]);
  const alreadyDone = isQuestDone(dateKey);

  const [index, setIndex] = useState(0);
  const [solved, setSolved] = useState(0);
  const [finished, setFinished] = useState(false);
  const [replay, setReplay] = useState(false);
  const [quest, setQuest] = useState<QuestState>(loadQuest);
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  const running = (!alreadyDone || replay) && !finished && challenges.length > 0;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const advance = (didSolve: boolean) => {
    const nextSolved = solved + (didSolve ? 1 : 0);
    setSolved(nextSolved);
    if (index + 1 < challenges.length) {
      setIndex(index + 1);
    } else {
      setFinished(true);
      if (nextSolved === challenges.length && !alreadyDone) {
        setQuest(recordQuestDone(dateKey));
      }
    }
  };

  const elapsed = Math.floor((now - startedAt) / 1000);
  const mm = Math.floor(elapsed / 60);
  const ss = String(elapsed % 60).padStart(2, '0');

  const current = challenges[index];

  return (
    <div className="page lesson-page">
      <button type="button" className="btn btn-ghost" onClick={onBack}>
        ← Parcours
      </button>
      <header className="lesson-header">
        <span className="lesson-phase">Défi du jour — {dateKey}</span>
        <h1>⚔️ Cinq exercices, zéro indice</h1>
      </header>

      {alreadyDone && !replay && !finished ? (
        <div className="lesson-finished">
          <span className="lesson-finished-emoji">🏆</span>
          <h2>Défi du jour déjà réussi !</h2>
          <p>
            Série : <strong>{quest.streak} jour{quest.streak > 1 ? 's' : ''}</strong> — record :{' '}
            {quest.best} — défis réussis en tout : {quest.totalDone}.
          </p>
          <p>Reviens demain pour prolonger la série. Le tirage change chaque jour.</p>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button type="button" className="btn" onClick={() => setReplay(true)}>
              🎲 Le refaire pour le plaisir
            </button>
            <button type="button" className="btn btn-primary" onClick={onBack}>
              Retour au parcours
            </button>
          </div>
        </div>
      ) : !finished && current ? (
        <>
          <div className="lesson-progressbar">
            {challenges.map((c, i) => (
              <span
                key={c.lesson.id + c.exercise.id}
                className={`dot ${i < index ? 'dot-done' : i === index ? 'dot-current' : ''}`}
              />
            ))}
          </div>
          <p style={{ textAlign: 'center', opacity: 0.75, margin: '0.2rem 0 0' }}>
            {index + 1}/{challenges.length} · Phase {current.lesson.phase} — {current.lesson.title}{' '}
            · ⏱ {mm}:{ss}
          </p>
          <ExercisePlayer
            key={current.lesson.id + current.exercise.id}
            exercise={current.exercise}
            exam
            onSuccess={() => advance(true)}
          />
          <button
            type="button"
            className="btn btn-ghost"
            style={{ alignSelf: 'center' }}
            onClick={() => advance(false)}
          >
            Passer cet exercice →
          </button>
        </>
      ) : (
        <div className="lesson-finished">
          <span className="lesson-finished-emoji">{solved === challenges.length ? '🏆' : '🎯'}</span>
          <h2>
            {solved}/{challenges.length} en {mm}:{ss}
          </h2>
          {solved === challenges.length ? (
            <p>
              Sans faute ! Série : <strong>{quest.streak} jour{quest.streak > 1 ? 's' : ''}</strong>{' '}
              — record : {quest.best}. Reviens demain : le tirage change.
            </p>
          ) : (
            <p>
              La série exige un sans-faute — les exercices sautés comptent. Retourne réviser les
              stations qui ont résisté, et retente demain.
            </p>
          )}
          <button type="button" className="btn btn-primary" onClick={onBack}>
            Retour au parcours
          </button>
        </div>
      )}
    </div>
  );
}
