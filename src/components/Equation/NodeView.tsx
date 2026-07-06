import type { ReactNode } from 'react';
import { type Expr, isCall } from '../../core/ast';

/** Sérialise un chemin en attribut data-path ("1.2"). */
export function pathToKey(path: number[]): string {
  return path.join('.');
}

export function keyToPath(key: string): number[] {
  return key === '' ? [] : key.split('.').map(Number);
}

interface NodeProps {
  node: Expr;
  path: number[];
}

function Wrap({ path, className, children }: { path: number[]; className: string; children: ReactNode }) {
  return (
    <span className={`eq-node ${className}`} data-path={pathToKey(path)}>
      {children}
    </span>
  );
}

/** Le nœud a-t-il besoin de parenthèses dans un contexte produit/négation ? */
function needsParens(node: Expr): boolean {
  return isCall(node) && (node[0] === 'Add' || node[0] === 'Negate');
}

function MaybeParens({ node, path }: NodeProps) {
  if (!needsParens(node)) return <NodeView node={node} path={path} />;
  return (
    <span className="eq-parens">
      <span className="eq-paren">(</span>
      <NodeView node={node} path={path} />
      <span className="eq-paren">)</span>
    </span>
  );
}

/** Un terme est-il "négatif" à l'affichage (pour dessiner un −) ? */
function negativePart(node: Expr): Expr | null {
  if (typeof node === 'number' && node < 0) return -node;
  if (isCall(node) && node[0] === 'Negate') return node[1];
  return null;
}

export function NodeView({ node, path }: NodeProps): ReactNode {
  if (typeof node === 'number') {
    if (node < 0) {
      return (
        <Wrap path={path} className="eq-number">
          <span className="eq-op">−</span>
          {String(-node)}
        </Wrap>
      );
    }
    return (
      <Wrap path={path} className="eq-number">
        {formatNumber(node)}
      </Wrap>
    );
  }

  if (typeof node === 'string') {
    return (
      <Wrap path={path} className="eq-symbol">
        {prettySymbol(node)}
      </Wrap>
    );
  }

  const h = node[0];
  const arg = (i: number) => node[i] as Expr;
  const sub = (i: number) => [...path, i];

  switch (h) {
    case 'Equal':
      return (
        <Wrap path={path} className="eq-equal">
          <NodeView node={arg(1)} path={sub(1)} />
          <span className="eq-op eq-eq-sign">=</span>
          <NodeView node={arg(2)} path={sub(2)} />
        </Wrap>
      );

    case 'Add': {
      const parts: ReactNode[] = [];
      for (let i = 1; i < node.length; i++) {
        const term = arg(i);
        const neg = negativePart(term);
        if (i > 1) {
          parts.push(
            <span key={`op${i}`} className="eq-op">
              {neg !== null ? '−' : '+'}
            </span>,
          );
        } else if (neg !== null) {
          parts.push(
            <span key={`op${i}`} className="eq-op">
              −
            </span>,
          );
        }
        // Un terme négatif est rendu « − valeur » : le signe est déjà émis,
        // le wrapper (data-path du terme entier) ne contient que la valeur.
        if (typeof term === 'number' && term < 0) {
          parts.push(
            <span key={i} className="eq-node eq-number eq-negterm" data-path={pathToKey(sub(i))}>
              {formatNumber(-term)}
            </span>,
          );
        } else if (isCall(term) && term[0] === 'Negate') {
          parts.push(
            <span key={i} className="eq-node eq-negterm" data-path={pathToKey(sub(i))}>
              <MaybeParens node={term[1]} path={[...sub(i), 1]} />
            </span>,
          );
        } else {
          parts.push(<NodeView key={i} node={term} path={sub(i)} />);
        }
      }
      return (
        <Wrap path={path} className="eq-add">
          {parts}
        </Wrap>
      );
    }

    case 'Negate':
      return (
        <Wrap path={path} className="eq-negate">
          <span className="eq-op">−</span>
          <MaybeParens node={arg(1)} path={sub(1)} />
        </Wrap>
      );

    case 'Multiply': {
      const parts: ReactNode[] = [];
      for (let i = 1; i < node.length; i++) {
        const factor = arg(i);
        if (i > 1 && !juxtaposable(arg(i - 1), factor)) {
          parts.push(
            <span key={`op${i}`} className="eq-op eq-times">
              ·
            </span>,
          );
        }
        parts.push(<MaybeParens key={i} node={factor} path={sub(i)} />);
      }
      return (
        <Wrap path={path} className="eq-multiply">
          {parts}
        </Wrap>
      );
    }

    case 'Divide':
      return (
        <Wrap path={path} className="eq-divide">
          <span className="eq-fraction">
            <span className="eq-numerator">
              <NodeView node={arg(1)} path={sub(1)} />
            </span>
            <span className="eq-fracbar" />
            <span className="eq-denominator">
              <NodeView node={arg(2)} path={sub(2)} />
            </span>
          </span>
        </Wrap>
      );

    case 'Power':
      return (
        <Wrap path={path} className="eq-power">
          <MaybeParens node={arg(1)} path={sub(1)} />
          <sup className="eq-exponent">
            <NodeView node={arg(2)} path={sub(2)} />
          </sup>
        </Wrap>
      );

    case 'Sqrt':
      return (
        <Wrap path={path} className="eq-sqrt">
          <span className="eq-radical">√</span>
          <span className="eq-radicand">
            <NodeView node={arg(1)} path={sub(1)} />
          </span>
        </Wrap>
      );

    case 'Root':
      return (
        <Wrap path={path} className="eq-sqrt">
          <sup className="eq-root-index">
            <NodeView node={arg(2)} path={sub(2)} />
          </sup>
          <span className="eq-radical">√</span>
          <span className="eq-radicand">
            <NodeView node={arg(1)} path={sub(1)} />
          </span>
        </Wrap>
      );

    case 'PlusMinus':
      return (
        <Wrap path={path} className="eq-plusminus">
          <span className="eq-op">±</span>
          <NodeView node={arg(1)} path={sub(1)} />
        </Wrap>
      );

    case 'Log':
      return (
        <Wrap path={path} className="eq-fn">
          <span className="eq-fnname">log</span>
          <sub className="eq-log-base">
            <NodeView node={arg(2)} path={sub(2)} />
          </sub>
          <span className="eq-paren">(</span>
          <NodeView node={arg(1)} path={sub(1)} />
          <span className="eq-paren">)</span>
        </Wrap>
      );

    case 'Ln':
      return (
        <Wrap path={path} className="eq-fn">
          <span className="eq-fnname">ln</span>
          <span className="eq-paren">(</span>
          <NodeView node={arg(1)} path={sub(1)} />
          <span className="eq-paren">)</span>
        </Wrap>
      );

    case 'Exp':
      return (
        <Wrap path={path} className="eq-power">
          <span className="eq-symbol">e</span>
          <sup className="eq-exponent">
            <NodeView node={arg(1)} path={sub(1)} />
          </sup>
        </Wrap>
      );

    case 'Int':
      // Primitive : ∫ corps dx. Le nœud entier est la cible du tap.
      return (
        <Wrap path={path} className="eq-integral">
          <span className="eq-int-sign">∫</span>
          <MaybeParens node={arg(1)} path={sub(1)} />
          <span className="eq-int-dx">
            d{typeof arg(2) === 'string' ? prettySymbol(arg(2) as string) : ''}
          </span>
        </Wrap>
      );

    case 'LT':
    case 'ILT':
      // Transformée de Laplace (et son inverse) : ℒ{f}, ℒ⁻¹{F}.
      return (
        <Wrap path={path} className="eq-laplace">
          <span className="eq-fnname eq-lt-sign">
            ℒ{h === 'ILT' && <sup className="eq-exponent">−1</sup>}
          </span>
          <span className="eq-paren">{'{'}</span>
          <NodeView node={arg(1)} path={sub(1)} />
          <span className="eq-paren">{'}'}</span>
        </Wrap>
      );

    case 'D':
      // Notation de Leibniz : d/dx (corps). Le nœud D entier est la cible du tap.
      return (
        <Wrap path={path} className="eq-derivative">
          <span className="eq-fraction eq-ddx">
            <span className="eq-numerator">d</span>
            <span className="eq-fracbar" />
            <span className="eq-denominator">
              d{typeof arg(2) === 'string' ? prettySymbol(arg(2) as string) : ''}
            </span>
          </span>
          <span className="eq-parens">
            <span className="eq-paren">(</span>
            <NodeView node={arg(1)} path={sub(1)} />
            <span className="eq-paren">)</span>
          </span>
        </Wrap>
      );

    case 'Mat2':
      // Matrice 2×2 (ligne par ligne) : grille entre crochets.
      return (
        <Wrap path={path} className="eq-matrix">
          <span className="eq-mat-grid">
            <span className="eq-mat-cell"><NodeView node={arg(1)} path={sub(1)} /></span>
            <span className="eq-mat-cell"><NodeView node={arg(2)} path={sub(2)} /></span>
            <span className="eq-mat-cell"><NodeView node={arg(3)} path={sub(3)} /></span>
            <span className="eq-mat-cell"><NodeView node={arg(4)} path={sub(4)} /></span>
          </span>
        </Wrap>
      );

    case 'Vec2':
      // Vecteur colonne.
      return (
        <Wrap path={path} className="eq-matrix">
          <span className="eq-mat-grid eq-vec-grid">
            <span className="eq-mat-cell"><NodeView node={arg(1)} path={sub(1)} /></span>
            <span className="eq-mat-cell"><NodeView node={arg(2)} path={sub(2)} /></span>
          </span>
        </Wrap>
      );

    case 'MatVec':
    case 'MatMul':
      // Av / AB : simple juxtaposition — le tap sur le nœud entier étale le calcul.
      return (
        <Wrap path={path} className="eq-matmul">
          <NodeView node={arg(1)} path={sub(1)} />
          <NodeView node={arg(2)} path={sub(2)} />
        </Wrap>
      );

    case 'VecScale':
      return (
        <Wrap path={path} className="eq-matmul">
          <NodeView node={arg(1)} path={sub(1)} />
          <NodeView node={arg(2)} path={sub(2)} />
        </Wrap>
      );

    case 'Det':
      return (
        <Wrap path={path} className="eq-fn">
          <span className="eq-fnname">det</span>
          <NodeView node={arg(1)} path={sub(1)} />
        </Wrap>
      );

    case 'Gcd':
      return (
        <Wrap path={path} className="eq-fn">
          <span className="eq-fnname">pgcd</span>
          <span className="eq-paren">(</span>
          <NodeView node={arg(1)} path={sub(1)} />
          <span className="eq-op eq-comma">,</span>
          <NodeView node={arg(2)} path={sub(2)} />
          <span className="eq-paren">)</span>
        </Wrap>
      );

    case 'Mod':
      // a mod n — l'arithmétique de l'horloge.
      return (
        <Wrap path={path} className="eq-mod">
          <MaybeParens node={arg(1)} path={sub(1)} />
          <span className="eq-op eq-modop">mod</span>
          <NodeView node={arg(2)} path={sub(2)} />
        </Wrap>
      );

    case 'Phi':
      // Indicatrice d'Euler : φ(n).
      return (
        <Wrap path={path} className="eq-fn">
          <span className="eq-fnname">φ</span>
          <span className="eq-paren">(</span>
          <NodeView node={arg(1)} path={sub(1)} />
          <span className="eq-paren">)</span>
        </Wrap>
      );

    case 'Conj':
      // Conjugué complexe : barre au-dessus.
      return (
        <Wrap path={path} className="eq-conj">
          <span className="eq-conj-inner">
            <NodeView node={arg(1)} path={sub(1)} />
          </span>
        </Wrap>
      );

    case 'Compose': {
      // Composition de symétries : a ∘ b (b s'applique d'abord).
      const parts: ReactNode[] = [];
      for (let i = 1; i < node.length; i++) {
        if (i > 1) {
          parts.push(
            <span key={`op${i}`} className="eq-op eq-compose-op">
              ∘
            </span>,
          );
        }
        parts.push(<NodeView key={i} node={arg(i)} path={sub(i)} />);
      }
      return (
        <Wrap path={path} className="eq-compose">
          {parts}
        </Wrap>
      );
    }

    case 'Subst':
      // Substitution : corps |_{v = valeur}.
      return (
        <Wrap path={path} className="eq-subst">
          <span className="eq-subst-body">
            <NodeView node={arg(1)} path={sub(1)} />
          </span>
          <span className="eq-subst-bar">|</span>
          <sub className="eq-subst-sub">
            <NodeView node={arg(2)} path={sub(2)} />
            <span className="eq-subst-eq">=</span>
            <NodeView node={arg(3)} path={sub(3)} />
          </sub>
        </Wrap>
      );

    case 'Inv':
      // Inverse d'une symétrie : g⁻¹.
      return (
        <Wrap path={path} className="eq-power">
          <MaybeParensInv node={arg(1)} path={sub(1)} />
          <sup className="eq-exponent">−1</sup>
        </Wrap>
      );

    default:
      return (
        <Wrap path={path} className="eq-fn">
          <span className="eq-fnname">{FN_NAMES[h] ?? h}</span>
          <span className="eq-paren">(</span>
          {node.slice(1).map((a, i) => (
            <NodeView key={i} node={a as Expr} path={sub(i + 1)} />
          ))}
          <span className="eq-paren">)</span>
        </Wrap>
      );
  }
}

/** `2x` s'écrit sans point : nombre suivi d'un symbole/fonction. */
function juxtaposable(prev: Expr, next: Expr): boolean {
  const prevSimple = typeof prev === 'number' || typeof prev === 'string';
  const nextSymbolic =
    typeof next === 'string' || (isCall(next) && ['Power', 'Sqrt', 'Ln'].includes(next[0]));
  return prevSimple && nextSymbolic && typeof next !== 'number';
}

function formatNumber(n: number): string {
  return String(n).replace('.', ',');
}

const FN_NAMES: Record<string, string> = {
  Sin: 'sin',
  Cos: 'cos',
  Tan: 'tan',
  Arcsin: 'arcsin',
  Arccos: 'arccos',
  Arctan: 'arctan',
};

/** L'argument d'un Inv est parenthésé s'il est composé (a ∘ b)⁻¹. */
function MaybeParensInv({ node, path }: NodeProps) {
  if (!isCall(node)) return <NodeView node={node} path={path} />;
  return (
    <span className="eq-parens">
      <span className="eq-paren">(</span>
      <NodeView node={node} path={path} />
      <span className="eq-paren">)</span>
    </span>
  );
}

const GREEK: Record<string, string> = {
  pi: 'π',
  theta: 'θ',
  alpha: 'α',
  beta: 'β',
  omega: 'ω',
  lambda: 'λ',
  Delta: 'Δ',
  // Les 8 symétries du carré (groupe D₄).
  idS: '𝟙',
  r90: 'r',
  r180: 'r²',
  r270: 'r³',
  sH: 'h',
  sV: 'v',
  sD: 'd',
  sA: 'd′',
};
function prettySymbol(s: string): string {
  return GREEK[s] ?? s;
}
