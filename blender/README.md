# Nuages du hero (Blender 5.1, Cycles / Metal)

La plaque `public/clouds.png` est générée en 3 passes débruitées puis assemblée :
R = lumière du soleil, G = lumière du ciel, B = opacité. Le shader `src/shaders/sky.ts` la recolore.

```sh
cd blender
W=2400 H=1350 S=128 ST=48 ./passes.sh final        # ~20 min sur M2
P=$PWD/final OUTP=../public/clouds.png \
  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python pack.py
```

Réglages utiles (variables d'environnement) : `SUNSTR`, `SUN_AZ`, `SUN_ELL`, `TILT`, `DMUL`, `SOFT`, `OCT`.
La composition des masses nuageuses est en bas de `sky_scene.py` (`cloud_box(...)`).

## Bancs de nuages des sections

`public/cloud-bank-left.png` et `public/cloud-bank-right.png` sont tirés des mêmes passes,
recolorés comme dans le hero et détourés (RGBA, fondu en bas) :

```sh
P=$PWD/final OUTD=../public \
  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python colorize.py
```
