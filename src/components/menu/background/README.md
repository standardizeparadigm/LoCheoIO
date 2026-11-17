# `src/components/menu/background/`

The layered CSS scene behind the menu: eight decorative layers (seven drawn
classes plus the corner-only vignette), each with its own duration and cycle.

| File | What it is |
| --- | --- |
| `layers.ts` | the eight layers as data: class name, z-order, and the note on each |
| `MenuBackground.tsx` | the component that stacks them |
| `index.ts` | the barrel |

## The layers, back to front

```
aurora-bg          four colour pools sliding, 16s — the contrast floor
nebula-a / nebula-b  two drifting blobs, 17s and 19s, opposite directions
light-ray          one slow diagonal, 11s, opacity breathing
star-field-far     distant stars, 5.2s twinkle, 1.3s delay
star-field         nearer stars, 3.6s
tile-floor         the floor grid — static, masked toward the top
glow-ring          the ring around the jar, 9s rotation (jar-glow 3.4s)
```

Durations are chosen so no cycle is a multiple of another (16 · 17 · 19 · 11 ·
5.2 · 3.6 · 9 · 3.4 · 2.9) and no two layers complete a cycle together — the
scene must not look looped at any glance length. The full analysis is in
`docs/design/menu-scene.md`, including the v1.1.7 contrast regression where four
layers compounded into a "foggy" screen and the decision that the floor — the
widest layer on screen — stays static. `tests/menu-scene-motion.test.ts` reads
the numbers in this file and in the design doc and compares both with the
stylesheet.

## Why the layers are data

`layers.ts` exists so the stack can be asserted without a DOM.
`tests/menu-background.test.ts` checks the contrast rules (blur ceiling, nebula
opacity peaks, corner-weighted vignette, render budget) and that the scene is no
longer inlined in `StartScreen`; `tests/menu-scene-motion.test.ts` checks both
documents against the stylesheet — every documented duration, every keyframe
name, and the claim that the floor is static.

A layer added to the component and not to the reduced-motion block is exactly
the bug that rule exists to prevent, and it is invisible in a screenshot.
