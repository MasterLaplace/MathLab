import type { SimSpec } from '../../content/schema';
import { KinematicsSim } from '../Physics/KinematicsSim';
import { TangentExplorer } from '../Physics/TangentExplorer';
import { AreaExplorer } from '../Physics/AreaExplorer';
import { SpringSim } from '../Physics/SpringSim';
import { VectorFieldExplorer } from '../Physics/VectorFieldExplorer';
import { VectorsExplorer } from '../Physics/VectorsExplorer';
import { MatrixExplorer } from '../Physics/MatrixExplorer';
import { FourierExplorer } from '../Physics/FourierExplorer';
import { Surface3D } from '../Physics/Surface3D';
import { UnitCircleExplorer } from '../Physics/UnitCircleExplorer';
import { DirectionFieldExplorer } from '../Physics/DirectionFieldExplorer';
import { GaltonExplorer } from '../Physics/GaltonExplorer';
import { BayesExplorer } from '../Physics/BayesExplorer';
import { RiemannExplorer } from '../Physics/RiemannExplorer';
import { PoleExplorer } from '../Physics/PoleExplorer';
import { ComplexExplorer } from '../Physics/ComplexExplorer';
import { EpicyclesExplorer } from '../Physics/EpicyclesExplorer';
import { ProbTreeExplorer } from '../Physics/ProbTreeExplorer';
import { RootsExplorer } from '../Physics/RootsExplorer';
import { StringExplorer } from '../Physics/StringExplorer';
import { EMWaveExplorer } from '../Physics/EMWaveExplorer';
import { DomainColoringExplorer } from '../Physics/DomainColoringExplorer';
import { RandomWalkExplorer } from '../Physics/RandomWalkExplorer';
import { ActionExplorer } from '../Physics/ActionExplorer';
import { FluidExplorer } from '../Physics/FluidExplorer';
import { QuantumWellExplorer } from '../Physics/QuantumWellExplorer';
import { DoublePendulumExplorer } from '../Physics/DoublePendulumExplorer';
import { PhaseSpaceExplorer } from '../Physics/PhaseSpaceExplorer';
import { TunnelExplorer } from '../Physics/TunnelExplorer';
import { MinkowskiExplorer } from '../Physics/MinkowskiExplorer';
import { SymmetryExplorer } from '../Physics/SymmetryExplorer';
import { DominoesExplorer } from '../Physics/DominoesExplorer';
import { PascalExplorer } from '../Physics/PascalExplorer';
import { EhrenfestExplorer } from '../Physics/EhrenfestExplorer';
import { IsingExplorer } from '../Physics/IsingExplorer';
import { OrbitExplorer } from '../Physics/OrbitExplorer';
import { HeatWaveExplorer } from '../Physics/HeatWaveExplorer';
import { PictorialProofExplorer } from '../Physics/PictorialProofExplorer';
import { NewtonExplorer } from '../Physics/NewtonExplorer';
import { ZenoExplorer } from '../Physics/ZenoExplorer';
import { CobwebExplorer } from '../Physics/CobwebExplorer';
import { TaylorExplorer } from '../Physics/TaylorExplorer';
import { AlgebraTilesExplorer } from '../Physics/AlgebraTilesExplorer';
import { PythagorasExplorer } from '../Physics/PythagorasExplorer';
import { SlideRuleExplorer } from '../Physics/SlideRuleExplorer';
import { FunctionTransformExplorer } from '../Physics/FunctionTransformExplorer';

/**
 * Le registre unique des visuels : une simulation se déclare par une donnée
 * (`SimSpec`) et s'affiche aussi bien sous un exercice que dans le cours
 * lui-même (bloc `sim` d'un `CourseBlock`).
 */
export function SimView({ sim, solved }: { sim: SimSpec; solved?: boolean }) {
  switch (sim.type) {
    case 'kinematics':
      return <KinematicsSim d={sim.d} t={sim.t} solved={solved ?? false} />;
    case 'tangent':
      return <TangentExplorer />;
    case 'area':
      return <AreaExplorer />;
    case 'vector-field':
      return <VectorFieldExplorer mode={sim.mode} />;
    case 'spring':
      return <SpringSim />;
    case 'vectors':
      return <VectorsExplorer />;
    case 'matrix':
      return <MatrixExplorer mode={sim.mode} />;
    case 'fourier':
      return <FourierExplorer />;
    case 'surface3d':
      return <Surface3D fn={sim.fn} />;
    case 'unit-circle':
      return <UnitCircleExplorer />;
    case 'direction-field':
      return <DirectionFieldExplorer />;
    case 'galton':
      return <GaltonExplorer />;
    case 'bayes':
      return <BayesExplorer />;
    case 'riemann':
      return <RiemannExplorer />;
    case 'poles':
      return <PoleExplorer />;
    case 'complex':
      return <ComplexExplorer />;
    case 'epicycles':
      return <EpicyclesExplorer />;
    case 'prob-tree':
      return <ProbTreeExplorer />;
    case 'roots':
      return <RootsExplorer />;
    case 'string-wave':
      return <StringExplorer />;
    case 'em-wave':
      return <EMWaveExplorer />;
    case 'domain-coloring':
      return <DomainColoringExplorer />;
    case 'random-walk':
      return <RandomWalkExplorer />;
    case 'action':
      return <ActionExplorer />;
    case 'fluid':
      return <FluidExplorer />;
    case 'quantum-well':
      return <QuantumWellExplorer />;
    case 'double-pendulum':
      return <DoublePendulumExplorer />;
    case 'phase-space':
      return <PhaseSpaceExplorer />;
    case 'tunnel':
      return <TunnelExplorer />;
    case 'minkowski':
      return <MinkowskiExplorer />;
    case 'symmetry':
      return <SymmetryExplorer />;
    case 'dominoes':
      return <DominoesExplorer />;
    case 'pascal':
      return <PascalExplorer mode={sim.mode} />;
    case 'ehrenfest':
      return <EhrenfestExplorer />;
    case 'ising':
      return <IsingExplorer />;
    case 'orbit':
      return <OrbitExplorer mode={sim.mode} />;
    case 'heat-wave':
      return <HeatWaveExplorer mode={sim.mode} />;
    case 'pictorial':
      return <PictorialProofExplorer mode={sim.mode} />;
    case 'newton':
      return <NewtonExplorer />;
    case 'zeno':
      return <ZenoExplorer mode={sim.mode} />;
    case 'cobweb':
      return <CobwebExplorer mode={sim.mode} />;
    case 'taylor':
      return <TaylorExplorer fn={sim.fn} />;
    case 'algebra-tiles':
      return <AlgebraTilesExplorer mode={sim.mode} />;
    case 'pythagoras':
      return <PythagorasExplorer />;
    case 'slide-rule':
      return <SlideRuleExplorer mode={sim.mode} />;
    case 'function-transform':
      return <FunctionTransformExplorer mode={sim.mode} />;
  }
}
