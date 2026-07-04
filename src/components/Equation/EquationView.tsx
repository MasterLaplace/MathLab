import { useCallback, useEffect, useRef, useState } from 'react';
import { type Expr, type Path, getAt } from '../../core/ast';
import { type Move, legalMoves } from '../../core/rules';
import { NodeView, keyToPath, pathToKey } from './NodeView';
import './equation.css';

interface EquationViewProps {
  expr: Expr;
  /** Appelé quand une manipulation légale est appliquée. */
  onApply?: (move: Move) => void;
  /** Appelé sur un geste illégal (pour afficher un indice). */
  onIllegal?: (path: Path) => void;
  interactive?: boolean;
  size?: 'md' | 'lg';
}

interface DragState {
  from: Path;
  moves: Move[];
  startX: number;
  startY: number;
  x: number;
  y: number;
  /** true dès que le seuil de déplacement est franchi. */
  dragging: boolean;
  hoveredTarget: string | null;
  ghostHtml: string;
}

const DRAG_THRESHOLD = 8;

export function EquationView({ expr, onApply, onIllegal, interactive = true, size = 'lg' }: EquationViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [rebound, setRebound] = useState<string | null>(null);
  const [tapMenu, setTapMenu] = useState<{ x: number; y: number; moves: Move[] } | null>(null);
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;

  // L'expression a changé (coup appliqué ailleurs) : le menu n'est plus valide.
  useEffect(() => setTapMenu(null), [expr]);

  // Un clic n'importe où ailleurs referme le menu de choix.
  useEffect(() => {
    if (!tapMenu) return;
    const close = () => setTapMenu(null);
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [tapMenu]);

  const findTarget = useCallback((state: DragState, clientX: number, clientY: number): string | null => {
    const container = containerRef.current;
    if (!container) return null;
    const dragTargets = state.moves.filter((m) => m.kind === 'drag' && m.to);
    for (const move of dragTargets) {
      const el = container.querySelector(`[data-path="${pathToKey(move.to!)}"]`);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const pad = 16;
      if (
        clientX >= r.left - pad &&
        clientX <= r.right + pad &&
        clientY >= r.top - pad &&
        clientY <= r.bottom + pad
      ) {
        return pathToKey(move.to!);
      }
    }
    return null;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!interactive) return;
      const target = (e.target as HTMLElement).closest('[data-path]');
      if (!target || !containerRef.current?.contains(target)) return;
      // On choisit le nœud le plus profond sous le pointeur qui a des coups légaux.
      let el: HTMLElement | null = target as HTMLElement;
      let moves: Move[] = [];
      let path: Path = [];
      while (el) {
        path = keyToPath(el.dataset.path ?? '');
        moves = legalMoves(expr, path);
        if (moves.length > 0) break;
        el = (el.parentElement?.closest('[data-path]') as HTMLElement) ?? null;
      }
      if (!el || moves.length === 0) {
        onIllegal?.(keyToPath((target as HTMLElement).dataset.path ?? ''));
        return;
      }
      e.preventDefault();
      setDrag({
        from: path,
        moves,
        startX: e.clientX,
        startY: e.clientY,
        x: e.clientX,
        y: e.clientY,
        dragging: false,
        hoveredTarget: null,
        ghostHtml: el.innerHTML,
      });
    },
    [expr, interactive, onIllegal],
  );

  useEffect(() => {
    if (!drag) return;

    const onMove = (e: PointerEvent) => {
      const state = dragRef.current;
      if (!state) return;
      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;
      const dragging = state.dragging || Math.hypot(dx, dy) > DRAG_THRESHOLD;
      setDrag({
        ...state,
        x: e.clientX,
        y: e.clientY,
        dragging,
        hoveredTarget: dragging ? findTarget(state, e.clientX, e.clientY) : null,
      });
    };

    const onUp = (e: PointerEvent) => {
      const state = dragRef.current;
      setDrag(null);
      if (!state) return;

      if (!state.dragging) {
        // Tap : un seul coup → on l'applique ; plusieurs → menu de choix.
        const taps = state.moves.filter((m) => m.kind === 'tap');
        if (taps.length === 1) onApply?.(taps[0]);
        else if (taps.length > 1) setTapMenu({ x: e.clientX, y: e.clientY, moves: taps });
        else triggerRebound(pathToKey(state.from));
        return;
      }

      const targetKey = findTarget(state, e.clientX, e.clientY);
      const move = state.moves.find((m) => m.kind === 'drag' && m.to && pathToKey(m.to) === targetKey);
      if (move) {
        onApply?.(move);
      } else {
        triggerRebound(pathToKey(state.from));
        onIllegal?.(state.from);
      }
    };

    const triggerRebound = (key: string) => {
      setRebound(key);
      setTimeout(() => setRebound(null), 450);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag !== null, findTarget, onApply, onIllegal]);

  const activeTargets = drag?.dragging
    ? drag.moves.filter((m) => m.kind === 'drag' && m.to).map((m) => pathToKey(m.to!))
    : [];

  return (
    <div
      ref={containerRef}
      className={[
        'equation-view',
        `equation-${size}`,
        interactive ? 'equation-interactive' : '',
        drag?.dragging ? 'equation-dragging' : '',
      ].join(' ')}
      onPointerDown={onPointerDown}
      style={
        {
          '--drag-from': drag?.dragging ? `"${pathToKey(drag.from)}"` : undefined,
        } as React.CSSProperties
      }
    >
      <DecoratedEquation
        expr={expr}
        dragFrom={drag?.dragging ? pathToKey(drag.from) : null}
        targets={activeTargets}
        hovered={drag?.hoveredTarget ?? null}
        rebound={rebound}
      />
      {drag?.dragging && (
        <span
          className="equation-ghost"
          style={{ left: drag.x, top: drag.y }}
          dangerouslySetInnerHTML={{ __html: drag.ghostHtml }}
        />
      )}
      {tapMenu && (
        <div
          className="eq-tap-menu"
          style={{
            left: Math.min(tapMenu.x, window.innerWidth - 330),
            top: tapMenu.y + 8,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {tapMenu.moves.map((m, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setTapMenu(null);
                onApply?.(m);
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Applique les classes d'état (source du drag, zones de dépôt, rebond) via
 * un effet DOM plutôt qu'en re-rendant l'arbre : les data-path sont stables.
 */
function DecoratedEquation({
  expr,
  dragFrom,
  targets,
  hovered,
  rebound,
}: {
  expr: Expr;
  dragFrom: string | null;
  targets: string[];
  hovered: string | null;
  rebound: string | null;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    for (const el of root.querySelectorAll('.eq-drag-source, .eq-drop-target, .eq-drop-hover, .eq-rebound')) {
      el.classList.remove('eq-drag-source', 'eq-drop-target', 'eq-drop-hover', 'eq-rebound');
    }
    const mark = (key: string | null, cls: string) => {
      if (key === null) return;
      root.querySelector(`[data-path="${key}"]`)?.classList.add(cls);
    };
    mark(dragFrom, 'eq-drag-source');
    for (const t of targets) mark(t, 'eq-drop-target');
    mark(hovered, 'eq-drop-hover');
    mark(rebound, 'eq-rebound');
  }, [dragFrom, targets, hovered, rebound]);

  // Vérification de cohérence : le nœud source doit exister dans l'AST.
  if (dragFrom !== null && getAt(expr, keyToPath(dragFrom)) === undefined) {
    dragFrom = null;
  }

  return (
    <span ref={ref} className="equation-root">
      <NodeView node={expr} path={[]} />
    </span>
  );
}
