# `src/components/menu/background/`

The layered CSS scene behind the menu: seven decorative layers, each with its
own duration and cycle.

| File | What it is |
| --- | --- |
| `layers.ts` | the seven layers as data: class name, z-order, and the note on each |
| `MenuBackground.tsx` | the component that stacks them |
| `index.ts` | the barrel |

## The layers, back to front

```
aurora-bg          static gradient, no animation — the contrast floor
nebula-a / -b      two drifting blobs, 19s and 26s, opposite directions
light-ray          one slow diagonal, 34s, opacity breathing
star-field-far     distant stars, 6s twinkle
star-field         nearer stars, 3.4s
tile-floor         the floor grid, 12s drift, masked toward the top
glow-ring          the ring around the jar, 22s rotation
```

Durations are chosen so the shortest is coprime-ish with the longest (3.4 and 34
share no obvious beat) and no two layers complete a cycle together — the scene
must not look looped at any glance length. The full analysis is in
`docs/design/menu-scene.md`, including the v1.1.7 contrast regression where four
layers compounded into a "foggy" screen.

## Why the layers are data

`layers.ts` exists so the stack can be asserted without a DOM. The test checks
that every layer's animation duration is in `index.css`, that no layer is
`opacity: 1` at its peak (the rule from the contrast regression), and that the
`prefers-reduced-motion` block names all seven.

A layer added to the component and not to the reduced-motion block is exactly
the bug that rule exists to prevent, and it is invisible in a screenshot.
