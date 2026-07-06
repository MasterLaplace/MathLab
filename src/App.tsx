import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { lessonById } from './content/lessons';
import { type Theme, applyTheme, loadSoundEnabled, loadTheme, saveSoundEnabled, saveTheme } from './core/prefs';
import { type Progress, loadProgress, markExerciseDone, resetProgress } from './core/progress';
import { setSoundEnabled } from './core/sound';
import { expeditions } from './content/expeditions';
import { Expedition } from './pages/Expedition';
import { Home } from './pages/Home';
import { LessonPage } from './pages/LessonPage';
import { Quest } from './pages/Quest';

// MathLive est lourd : le Playground est chargé à la demande.
const Playground = lazy(() => import('./pages/Playground').then((m) => ({ default: m.Playground })));

type Route =
  | { name: 'home' }
  | { name: 'lesson'; id: string }
  | { name: 'playground' }
  | { name: 'quest' }
  | { name: 'expedition'; id: string };

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash === 'playground') return { name: 'playground' };
  if (hash === 'quest') return { name: 'quest' };
  if (hash.startsWith('lesson/')) return { name: 'lesson', id: hash.slice('lesson/'.length) };
  if (hash.startsWith('expedition/')) return { name: 'expedition', id: hash.slice('expedition/'.length) };
  return { name: 'home' };
}

function PrefsBar() {
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [sound, setSound] = useState(loadSoundEnabled);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    saveTheme(next);
  };

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    saveSoundEnabled(next);
    setSoundEnabled(next);
  };

  return (
    <div className="prefs-bar">
      <button type="button" className="btn" onClick={toggleTheme} title="Changer de thème">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <button type="button" className="btn" onClick={toggleSound} title="Activer/couper le son">
        {sound ? '🔊' : '🔇'}
      </button>
    </div>
  );
}

function App() {
  const [route, setRoute] = useState<Route>(parseHash);
  const [progress, setProgress] = useState<Progress>(loadProgress);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (hash: string) => {
    window.location.hash = hash;
  };

  const handleExerciseDone = useCallback((lessonId: string) => {
    const lesson = lessonById(lessonId);
    if (!lesson) return;
    setProgress((p) => markExerciseDone(p, lessonId, lesson.exercises.length));
  }, []);

  let page: React.ReactNode;
  const lesson = route.name === 'lesson' ? lessonById(route.id) : undefined;
  if (route.name === 'lesson' && lesson) {
    page = (
      <LessonPage
        key={lesson.id}
        lesson={lesson}
        onExerciseDone={handleExerciseDone}
        onBack={() => go('/')}
      />
    );
  } else if (route.name === 'quest') {
    page = <Quest onBack={() => go('/')} />;
  } else if (route.name === 'expedition') {
    const expedition = expeditions.find((e) => e.id === route.id);
    page = expedition ? (
      <Expedition key={expedition.id} expedition={expedition} onBack={() => go('/')} />
    ) : (
      <p style={{ textAlign: 'center', marginTop: '4rem' }}>Expédition introuvable.</p>
    );
  } else if (route.name === 'playground') {
    page = (
      <Suspense fallback={<p style={{ textAlign: 'center', marginTop: '4rem' }}>Chargement…</p>}>
        <Playground onBack={() => go('/')} />
      </Suspense>
    );
  } else {
    page = (
      <Home
        progress={progress}
        onOpenLesson={(id) => go(`/lesson/${id}`)}
        onOpenPlayground={() => go('/playground')}
        onOpenQuest={() => go('/quest')}
        onOpenExpedition={(id) => go(`/expedition/${id}`)}
        onResetProgress={() => setProgress(resetProgress())}
      />
    );
  }

  return (
    <>
      <PrefsBar />
      {page}
    </>
  );
}

export default App;
