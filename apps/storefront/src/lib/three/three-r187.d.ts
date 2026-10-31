import 'three';

// three r187 replaced `iridescenceThicknessRange` with these two fields;
// @types/three 0.186 does not declare them yet.
declare module 'three' {
  interface MeshPhysicalMaterial {
    iridescenceThicknessMinimum: number;
    iridescenceThicknessMaximum: number;
  }
}
