# Player Builder AI - Phase 3 Documentation

## 3D Avatar System

The 3D avatar system uses `three.js` and `@react-three/fiber` to render a customizable player model.

### Base Model
The system expects a GLB model at `mobile/assets/models/base_player.glb`.
If not found, it uses a technical placeholder (sphere/cylinder) to allow development to continue.

### Model Requirements
For optimal results, the GLB model should include:
- Meshes named with 'skin', 'head', 'body' for skin tone application.
- Meshes named with 'hair' for hair color application.
- Meshes named with 'shirt' for team color application.
- A human-like skeletal structure.

### Blendshapes (Morph Targets)
The `AvatarBlendshapeService` is prepared to apply the following blendshapes if they exist in the model:
- `headShape`
- `jawWidth`
- `chinHeight`
- `eyesSize`
- `eyesDistance`
- `noseWidth`
- `noseHeight`
- `mouthWidth`
- `lipThickness`

These blendshapes should map 0-1 range from the 0-100 values in `AvatarConfig`.

### Connecting Phase 4
Phase 4 will focus on:
- Actual athletic animations (idle, celebration).
- High-fidelity textures and professional lighting.
- Exporting the player card as a PNG.
- Expanded wardrobe (jerseys, boots).
