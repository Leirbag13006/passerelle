# Assemble les 3 passes en une texture : R = lumière solaire, G = lumière du ciel, B = opacité
import bpy, numpy as np, os, sys
p = os.environ["P"]; out = os.environ["OUTP"]
def load(name):
    im = bpy.data.images.load(f"{p}_{name}.png")
    im.colorspace_settings.name = 'Non-Color'
    w, h = im.size
    a = np.empty(w * h * 4, dtype=np.float32); im.pixels.foreach_get(a)
    return a.reshape(h, w, 4)[..., :3], w, h
sun, w, h = load("sun"); sky, _, _ = load("sky"); t, _, _ = load("t")
lum = lambda c: c[..., 0] * 0.2126 + c[..., 1] * 0.7152 + c[..., 2] * 0.0722
to_lin = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
alpha = 1.0 - to_lin(np.clip(lum(t), 0, 1))
sky_l = lum(sky)
# le ciel est faible : on l'étire pour exploiter les 8 bits
sky_l = np.clip(sky_l / max(np.percentile(sky_l, 99.7), 1e-4), 0, 1)
sun_l = lum(sun); sun_l = np.clip(sun_l / max(sun_l.max(), 1e-4), 0, 1)
print("STATS sun max", sun_l.max(), "sky max", lum(sky).max(), "alpha max", alpha.max())
o = np.ones((h, w, 4), dtype=np.float32)
o[..., 0] = sun_l; o[..., 1] = sky_l; o[..., 2] = np.clip(alpha, 0, 1)
img = bpy.data.images.new("packed", w, h, alpha=False, float_buffer=False)
img.colorspace_settings.name = 'Non-Color'
img.pixels.foreach_set(o.ravel())
img.filepath_raw = out; img.file_format = 'PNG'; img.save()
print("PACKED", out, w, h)

web = os.environ.get("OUTW")
if web:
    img.file_format = 'WEBP'
    bpy.context.scene.render.image_settings.quality = 92
    img.filepath_raw = web; img.save(quality=92)
    print("WEBP", web)
