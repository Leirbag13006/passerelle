# Nuages « prêts à poser » pour les sections : recolorés comme dans le shader du hero
# (corps bleu nuit, ambiance bleue, liseré doré), détourés en RGBA et découpés en deux bancs.
import bpy, numpy as np, os
p = os.environ["P"]; out_dir = os.environ["OUTD"]
def load(name):
    im = bpy.data.images.load(f"{p}_{name}.png"); im.colorspace_settings.name = 'Non-Color'
    w, h = im.size; a = np.empty(w * h * 4, dtype=np.float32); im.pixels.foreach_get(a)
    return a.reshape(h, w, 4)[..., :3], w, h
lum = lambda c: c[..., 0] * 0.2126 + c[..., 1] * 0.7152 + c[..., 2] * 0.0722
to_lin = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
to_srgb = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(np.maximum(c, 0), 1 / 2.4) - 0.055)
def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)

sun, w, h = load("sun"); sky, _, _ = load("sky"); t, _, _ = load("t")
a = 1.0 - to_lin(np.clip(lum(t), 0, 1))
sunE = lum(sun); sunE = np.clip(sunE / sunE.max(), 0, 1); sunL = sunE * sunE
skyE = lum(sky); skyE = np.clip(skyE / np.percentile(skyE, 99.7), 0, 1); skyL = skyE ** 2.2

body = np.array([0.008, 0.012, 0.050])
ambient = np.array([0.26, 0.34, 0.90])[None, None] * (skyL * 0.035)[..., None]
rimK = smooth(0.30, 0.95, sunL) ** 2
rimCol = np.array([0.98, 0.55, 0.26]) * (1 - smooth(0.25, 0.9, sunL))[..., None] + np.array([1.0, 0.78, 0.56]) * smooth(0.25, 0.9, sunL)[..., None]
rim = rimCol * (rimK * 1.25)[..., None] + np.array([0.30, 0.36, 0.85]) * (sunL * 0.05)[..., None]
premul = body * a[..., None] + ambient + rim
straight = np.clip(premul / np.maximum(a, 1e-3)[..., None], 0, 1)
rgba = np.concatenate([to_srgb(straight), a[..., None]], axis=-1).astype(np.float32)

def save(name, x0, x1, y0, y1, scale):
    crop = np.array(rgba[y0:y1, x0:x1])  # lignes de bas en haut (convention Blender)
    ch, cw = crop.shape[:2]
    # fondu vers le bas : le banc se dissout au lieu d'être coupé net
    fade = smooth(0.0, 0.55, np.arange(ch) / ch)[:, None]
    crop[..., 3] *= fade
    img = bpy.data.images.new(name, cw, ch, alpha=True, float_buffer=False)
    img.colorspace_settings.name = 'Non-Color'
    img.pixels.foreach_set(crop.ravel())
    img.scale(int(cw * scale), int(ch * scale))
    img.filepath_raw = os.path.join(out_dir, name + ".png"); img.file_format = 'PNG'; img.save()
    print("SAVED", name, int(cw * scale), int(ch * scale))

# banc gauche (grande masse) et banc droit (nappe basse)
save("cloud-bank-left", 0, 1500, 0, 740, 0.62)
save("cloud-bank-right", 1150, 2400, 0, 330, 0.62)
