// Ciel crépusculaire du hero : dégradé bleu nuit, étoiles, traînée lumineuse « transmodale »
// (pointillés → tirets → trait continu) et nuages volumétriques rendus dans Blender.
// La plaque de nuages (public/clouds.webp) contient 3 canaux : R = lumière du soleil,
// G = lumière du ciel, B = opacité. Elle est recolorée ici, ce qui permet de régler
// les teintes sans refaire le rendu.

export const skyVertex = /* glsl */ `#version 300 es
in vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

export const skyFragment = /* glsl */ `#version 300 es
precision highp float;

uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;   // -1..1, lissé côté JS
uniform float u_scale;  // ratio pixels canvas / pixels CSS
uniform sampler2D u_clouds;
uniform float u_cloudAspect;
uniform float u_cloudsReady;

out vec4 fragColor;

// ---------- bruit ----------
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
const mat2 ROT = mat2(0.80, 0.60, -0.60, 0.80);
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 6; i++) {
    v += a * noise(p);
    p = ROT * p * 2.03 + 17.1;
    a *= 0.5;
  }
  return v;
}
float fbm3(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = ROT * p * 2.03 + 17.1;
    a *= 0.5;
  }
  return v;
}

// ---------- plaque de nuages ----------
// Remplit l'écran comme background-size: cover, ancrée en bas et vers la gauche
// pour garder la masse principale visible, avec une légère marge pour la dérive.
vec2 cloudUV(vec2 uv, float aspect, vec2 drift) {
  float zoom = 1.08;
  vec2 s = aspect > u_cloudAspect ? vec2(1.0, u_cloudAspect / aspect) : vec2(aspect / u_cloudAspect, 1.0);
  s /= zoom;
  vec2 anchor = vec2(aspect > u_cloudAspect ? 0.5 : 0.3, 0.02);
  vec2 origin = anchor * (1.0 - s);
  return origin + uv * s + drift;
}

// ---------- étoiles ----------
float starLayer(vec2 fragPx, float cell, float threshold, float t, float sizePx) {
  vec2 g = fragPx / cell;
  vec2 id = floor(g);
  vec2 f = fract(g);
  float h = hash12(id);
  if (h < threshold) return 0.0;
  vec2 pos = 0.15 + 0.7 * hash22(id + 3.7);
  float dist = length((f - pos) * cell);
  float tw = 0.55 + 0.45 * sin(t * (0.6 + 2.2 * hash12(id + 9.1)) + h * 40.0);
  float core = exp(-dist * dist / (sizePx * sizePx));
  float bright = (h - threshold) / (1.0 - threshold);
  return core * tw * (0.35 + 0.65 * bright);
}

// ---------- traînée transmodale ----------
// Retourne l'intensité lumineuse d'un voyageur qui traverse le ciel.
// Le motif change le long du trajet : marche (points), vélo (tirets), train (trait).
float traveler(vec2 p, float t, float aspect, out float headGlow) {
  float period = 22.0;
  float ph = fract(t / period);
  vec2 A = vec2(-0.55 * aspect, -0.28);
  vec2 B = vec2(0.62 * aspect, -0.14);
  vec2 dir = normalize(B - A);
  vec2 n = vec2(-dir.y, dir.x);
  float len = length(B - A);
  float along = dot(p - A, dir);
  float perp = dot(p - A, n);
  // la tête traverse puis le ciel reste calme un moment
  float headS = mix(-0.25, len + 0.9, smoothstep(0.0, 0.78, ph));
  float behind = headS - along;
  // fondu global en fin de cycle
  float life = smoothstep(1.0, 0.86, ph) * smoothstep(0.0, 0.03, ph);

  // segment du trajet (0 = marche, 1 = vélo, 2 = train)
  float seg = clamp(along / len, 0.0, 1.0);
  float walk = 1.0 - smoothstep(0.30, 0.36, seg);
  float train = smoothstep(0.64, 0.70, seg);
  float bike = 1.0 - walk - train;

  // points ronds et doux pour la marche, tirets aux bouts arrondis pour le vélo
  float fd = fract(along * 70.0) - 0.5;
  float dots = exp(-fd * fd * 90.0);
  float fs = abs(fract(along * 26.0) - 0.5);
  float dashes = smoothstep(0.34, 0.22, fs);
  float pattern = walk * dots + bike * dashes + train;

  // la traînée s'élargit et se disperse comme une traînée de condensation
  float trailLen = 1.25;
  float spread = 0.0010 + max(behind, 0.0) * 0.006;
  float core = exp(-perp * perp / (spread * spread));
  float haze = exp(-perp * perp / (spread * spread * 18.0)) * 0.22;
  float age = smoothstep(trailLen, 0.0, behind) * step(0.0, behind);
  float breakup = 0.65 + 0.35 * fbm3(vec2(along * 18.0, perp * 220.0) + t * 0.05);
  float trail = (core * mix(1.0, pattern, smoothstep(0.02, 0.10, behind)) + haze) * age * age * breakup;

  float dh = length(p - (A + dir * headS));
  headGlow = (exp(-dh * dh / 0.000018) * 1.6 + exp(-dh * dh / 0.0009) * 0.35) * life;
  return trail * life;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 p = (frag - 0.5 * u_res) / u_res.y;
  float t = u_time;

  // léger parallaxe au pointeur
  vec2 par = u_mouse * vec2(0.012, 0.006);

  // ---------- dégradé du ciel ----------
  vec3 zenith = vec3(0.012, 0.022, 0.110);
  vec3 upper  = vec3(0.035, 0.075, 0.330);
  vec3 mid    = vec3(0.090, 0.175, 0.620);
  vec3 low    = vec3(0.230, 0.330, 0.820);
  vec3 col = mix(low, mid, smoothstep(0.02, 0.42, uv.y));
  col = mix(col, upper, smoothstep(0.38, 0.78, uv.y));
  col = mix(col, zenith, smoothstep(0.72, 1.10, uv.y));

  // lumière diagonale : coin haut-gauche plus sombre, bas-droite plus clair
  float diag = smoothstep(-0.1, 1.2, uv.x * 0.75 + (1.0 - uv.y) * 0.55);
  col *= 0.62 + 0.52 * diag;

  // lueur d'horizon lavande / violette (le seul écho chromatique de la marque)
  float hz = exp(-uv.y * 5.5);
  col += vec3(0.42, 0.40, 0.95) * hz * 0.28 * (0.55 + 0.45 * uv.x);
  col += vec3(0.69, 0.31, 1.00) * exp(-uv.y * 11.0) * 0.10 * smoothstep(0.3, 1.0, uv.x);

  // voiles d'altitude très ténus
  float cirrus = fbm(vec2(p.x * 0.9 + t * 0.004 + par.x * 0.5, p.y * 7.0 + 3.0));
  col += vec3(0.55, 0.60, 1.0) * smoothstep(0.62, 0.9, cirrus) * 0.025 * smoothstep(0.2, 0.6, uv.y);

  // ---------- étoiles ----------
  float starMask = smoothstep(0.22, 0.70, uv.y);
  vec2 fp = frag / u_scale + par * 400.0;
  float stars = starLayer(fp, 7.0, 0.985, t, 0.55)
              + starLayer(fp + 91.0, 23.0, 0.975, t, 0.9) * 1.4
              + starLayer(fp + 311.0, 61.0, 0.93, t * 0.7, 1.25) * 1.8;
  col += vec3(0.86, 0.90, 1.0) * stars * starMask;

  // ---------- traînée ----------
  float head;
  float tr = traveler(p + par * 0.4, t, aspect, head);
  vec3 trailCol = mix(vec3(0.80, 0.84, 1.0), vec3(0.95, 0.88, 1.0), uv.x);
  col += trailCol * tr * 0.85;
  col += vec3(0.98, 0.95, 1.0) * head;

  // ---------- nuages ----------
  if (u_cloudsReady > 0.0) {
    // dérive lente (aller-retour) + respiration par champ de flux à basse fréquence
    vec2 drift = vec2(sin(t * 0.021) * 0.012, sin(t * 0.017 + 1.3) * 0.003) - par * vec2(1.0, 0.6);
    vec2 cuv = cloudUV(uv, aspect, drift);
    vec2 flow = vec2(noise(cuv * 3.0 + vec2(t * 0.035, 0.0)), noise(cuv * 3.0 + vec2(7.1, -t * 0.03))) - 0.5;
    cuv += flow * 0.0035;
    vec3 c = texture(u_clouds, cuv).rgb;
    float sunL = c.r * c.r; // la plaque finale est normalisée sur le pixel le plus clair : on garde plus de dynamique
    float skyL = pow(c.g, 2.2);
    float a = c.b * u_cloudsReady;

    float h = clamp(uv.y / 0.55, 0.0, 1.0);
    // corps : bleu nuit qui s'éclaircit avec la lumière du ciel
    vec3 body = mix(vec3(0.012, 0.016, 0.055), vec3(0.055, 0.075, 0.230), h);
    vec3 ambient = vec3(0.26, 0.34, 0.90) * skyL * 0.42;
    // liseré : or chaud dans les creux, pêche pâle sur les crêtes les plus exposées
    float rimK = smoothstep(0.03, 0.85, sunL);
    rimK *= rimK;
    vec3 rimCol = mix(vec3(0.98, 0.55, 0.26), vec3(1.00, 0.78, 0.56), smoothstep(0.25, 0.9, sunL));
    vec3 rim = rimCol * rimK * 1.25 + vec3(0.40, 0.42, 0.85) * sunL * 0.10;
    vec3 cloud = body * a + ambient + rim;
    col = col * (1.0 - a) + cloud;
  }

  // ---------- finition ----------
  float vig = smoothstep(1.35, 0.35, length((uv - vec2(0.55, 0.45)) * vec2(1.0, 1.15)));
  col *= 0.78 + 0.22 * vig;
  col = col / (1.0 + col * 0.18); // compression douce des hautes lumières
  col = pow(col, vec3(0.95));
  float grain = hash12(frag + fract(t * 7.13) * 431.0) - 0.5;
  col += grain * 0.028;

  fragColor = vec4(col, 1.0);
}
`
