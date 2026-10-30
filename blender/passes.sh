#!/bin/sh
# passes.sh prefixe  (W,H,S en env) -> prefixe_sun.png prefixe_sky.png prefixe_t.png
p=$1; shift
B=/Applications/Blender.app/Contents/MacOS/Blender
COMMON="ANISO=0.6 DMUL=0.5 SOFT=0.22 DETW=1.0 OCT=6 ROUGH=0.52 SUN_AZ=-30 SUN_ELL=-2 $*"
env W=$W H=$H S=$S $COMMON SKYSTR=0 SUNSTR=${SUNSTR:-2.5} CAMBG=0 OUT=$PWD/${p}_sun.png $B -b --factory-startup -P sky_scene.py 2>&1 | grep Error
env W=$W H=$H S=$S $COMMON SKYSTR=0.35 SUNSTR=0 CAMBG=0 OUT=$PWD/${p}_sky.png $B -b --factory-startup -P sky_scene.py 2>&1 | grep Error
env W=$W H=$H S=${ST:-16} $COMMON SKYSTR=0 SUNSTR=0 CAMBG=1 OUT=$PWD/${p}_t.png $B -b --factory-startup -P sky_scene.py 2>&1 | grep Error
echo done $p
