import bpy, math, os
from mathutils import Vector

W = int(os.environ.get("W", 960)); H = int(os.environ.get("H", 540))
SAMPLES = int(os.environ.get("S", 24))
OUT = os.environ.get("OUT", "/tmp/sky.png")
SUN_EL = float(os.environ.get("SUN_EL", "-1.5"))

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'METAL'; prefs.get_devices()
for d in prefs.devices: d.use = (d.type == 'METAL')
sc.cycles.device = 'GPU'
sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 8
sc.cycles.volume_bounces = 6
sc.cycles.volume_step_rate = float(os.environ.get("STEP", "1.0"))
sc.cycles.volume_max_steps = 512
sc.render.resolution_x = W; sc.render.resolution_y = H; sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_depth = '16'
sc.render.image_settings.color_mode = 'RGB'
sc.render.film_transparent = False
sc.render.filepath = OUT
for vt in (os.environ.get('VT', 'Standard'),):
    try:
        sc.view_settings.view_transform = vt; break
    except Exception: pass
sc.view_settings.exposure = float(os.environ.get("EXPO", "0.0"))

# ---------- ciel ----------
world = bpy.data.worlds.new("Sky"); sc.world = world; world.use_nodes = True
nt = world.node_tree; nt.nodes.clear()
sky = nt.nodes.new('ShaderNodeTexSky'); sky.sky_type = 'MULTIPLE_SCATTERING'
sky.sun_elevation = math.radians(SUN_EL)
sky.sun_rotation = math.radians(200)   # soleil devant, légèrement à droite
sky.altitude = 2500
sky.air_density = 1.0; sky.aerosol_density = 1.2; sky.ozone_density = 2.0
sky.sun_disc = False
bg = nt.nodes.new('ShaderNodeBackground'); bg.inputs['Strength'].default_value = float(os.environ.get("SKYSTR", "1.0"))
bgc = nt.nodes.new('ShaderNodeBackground'); cv = float(os.environ.get("CAMBG", "0"))
bgc.inputs['Color'].default_value = (cv, cv, cv, 1); bgc.inputs['Strength'].default_value = 1.0
lp = nt.nodes.new('ShaderNodeLightPath')
mx = nt.nodes.new('ShaderNodeMixShader')
out = nt.nodes.new('ShaderNodeOutputWorld')
nt.links.new(sky.outputs['Color'], bg.inputs['Color'])
nt.links.new(lp.outputs['Is Camera Ray'], mx.inputs['Fac'])
nt.links.new(bg.outputs['Background'], mx.inputs[1])
nt.links.new(bgc.outputs['Background'], mx.inputs[2])
nt.links.new(mx.outputs['Shader'], out.inputs['Surface'])

# ---------- caméra ----------
cam_data = bpy.data.cameras.new("Cam"); cam_data.lens = 26; cam_data.clip_end = 20000
cam = bpy.data.objects.new("Cam", cam_data); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (0, 0, 0)
cam.rotation_euler = (math.radians(90 + float(os.environ.get('TILT', '10'))), 0, 0)  # regarde +Y, légèrement vers le haut

# ---------- soleil (rasant, sous l'horizon : éclaire le dessous des nuages) ----------
sun_d = bpy.data.lights.new("Sun", 'SUN'); sun_d.energy = float(os.environ.get("SUNSTR", "4.0"))
sun_d.color = (1.0, 0.95, 0.9); sun_d.angle = math.radians(2.0)
sun = bpy.data.objects.new("Sun", sun_d); sc.collection.objects.link(sun)
az = math.radians(float(os.environ.get('SUN_AZ', '-25')))  # azimut vers la droite depuis +Y
el = math.radians(float(os.environ.get('SUN_ELL', '-2.0')))
to_sun = Vector((math.sin(az) * math.cos(el), math.cos(az) * math.cos(el), math.sin(el)))
sun.rotation_euler = (-to_sun).to_track_quat('-Z', 'Y').to_euler()

# ---------- matériau nuage ----------
def cloud_material(name, scale_xyz, seed, coverage, density, SLOPE):
    m = bpy.data.materials.new(name); m.use_nodes = True
    t = m.node_tree; t.nodes.clear()
    o = t.nodes.new('ShaderNodeOutputMaterial')
    pv = t.nodes.new('ShaderNodeVolumePrincipled')
    pv.inputs['Color'].default_value = (1, 1, 1, 1)
    pv.inputs['Anisotropy'].default_value = float(os.environ.get('ANISO', '0.7'))
    tc = t.nodes.new('ShaderNodeTexCoord')
    sep = t.nodes.new('ShaderNodeSeparateXYZ')
    t.links.new(tc.outputs['Object'], sep.inputs[0])
    # coordonnées isotropes en "mètres"
    mp = t.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = scale_xyz
    mp.inputs['Location'].default_value = (seed, seed * 0.7, 0)
    t.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    # forme globale (grosses bulles) + détail (cumulus)
    big = t.nodes.new('ShaderNodeTexNoise'); big.inputs['Scale'].default_value = 0.006
    big.inputs['Detail'].default_value = 3; big.inputs['Roughness'].default_value = 0.5
    det = t.nodes.new('ShaderNodeTexNoise'); det.inputs['Scale'].default_value = 0.028
    det.inputs['Detail'].default_value = float(os.environ.get('OCT', '6')); det.inputs['Roughness'].default_value = float(os.environ.get('ROUGH', '0.52'))
    det.inputs['Distortion'].default_value = 0.25
    t.links.new(mp.outputs['Vector'], big.inputs['Vector'])
    t.links.new(mp.outputs['Vector'], det.inputs['Vector'])
    mix = t.nodes.new('ShaderNodeMath'); mix.operation = 'MULTIPLY_ADD'
    mix.inputs[1].default_value = float(os.environ.get('DETW', '0.75'))
    t.links.new(det.outputs['Fac'], mix.inputs[0]); t.links.new(big.outputs['Fac'], mix.inputs[2])
    # profil vertical : base plate, sommet qui s'abaisse vers +X (masse qui descend vers la droite)
    zb = t.nodes.new('ShaderNodeMapRange')
    zb.inputs['From Min'].default_value = -1.0; zb.inputs['From Max'].default_value = -0.8
    t.links.new(sep.outputs['Z'], zb.inputs['Value'])
    slope = t.nodes.new('ShaderNodeMath'); slope.operation = 'MULTIPLY_ADD'
    slope.inputs[1].default_value = SLOPE; slope.inputs[2].default_value = 0.0
    t.links.new(sep.outputs['X'], slope.inputs[0])
    zadd = t.nodes.new('ShaderNodeMath'); zadd.operation = 'ADD'
    t.links.new(sep.outputs['Z'], zadd.inputs[0]); t.links.new(slope.outputs[0], zadd.inputs[1])
    zt = t.nodes.new('ShaderNodeMapRange')
    zt.inputs['From Min'].default_value = 1.0; zt.inputs['From Max'].default_value = -0.4
    t.links.new(zadd.outputs[0], zt.inputs['Value'])
    zprod = t.nodes.new('ShaderNodeMath'); zprod.operation = 'MULTIPLY'
    t.links.new(zb.outputs['Result'], zprod.inputs[0]); t.links.new(zt.outputs['Result'], zprod.inputs[1])
    lx = t.nodes.new('ShaderNodeVectorMath'); lx.operation = 'LENGTH'
    cxy = t.nodes.new('ShaderNodeCombineXYZ')
    t.links.new(sep.outputs['X'], cxy.inputs['X']); t.links.new(sep.outputs['Y'], cxy.inputs['Y'])
    t.links.new(cxy.outputs[0], lx.inputs[0])
    edge = t.nodes.new('ShaderNodeMapRange')
    edge.inputs['From Min'].default_value = 1.0; edge.inputs['From Max'].default_value = 0.35
    t.links.new(lx.outputs['Value'], edge.inputs['Value'])
    shape = t.nodes.new('ShaderNodeMath'); shape.operation = 'MULTIPLY'
    t.links.new(zprod.outputs[0], shape.inputs[0]); t.links.new(edge.outputs['Result'], shape.inputs[1])
    # v = bruit + forme*0.9 - 0.9 : la forme « érode » le bruit vers les bords
    dens = t.nodes.new('ShaderNodeMath'); dens.operation = 'MULTIPLY_ADD'
    dens.inputs[1].default_value = 0.9
    t.links.new(shape.outputs[0], dens.inputs[0]); t.links.new(mix.outputs[0], dens.inputs[2])
    thr = t.nodes.new('ShaderNodeMapRange')
    thr.inputs['From Min'].default_value = coverage; thr.inputs['From Max'].default_value = coverage + float(os.environ.get('SOFT', '0.2'))
    thr.inputs['To Max'].default_value = density * float(os.environ.get('DMUL', '1.0'))
    thr.interpolation_type = 'SMOOTHSTEP'
    t.links.new(dens.outputs[0], thr.inputs['Value'])
    t.links.new(thr.outputs['Result'], pv.inputs['Density'])
    t.links.new(pv.outputs['Volume'], o.inputs['Volume'])
    return m

def cloud_box(name, loc, size, seed, coverage, density, slope=0.0):
    bpy.ops.mesh.primitive_cube_add(size=2, location=loc)
    ob = bpy.context.active_object; ob.name = name
    ob.scale = size
    ob.data.materials.append(cloud_material(name + "M", size, seed, coverage, density, slope))
    return ob

# masse principale : cumulus qui monte depuis le coin bas-gauche
cloud_box("CloudA", (-300, 560, -40), (330, 260, 120), 3.1, 1.30, 0.05, 0.55)
# masse secondaire, basse et lointaine, en bas à droite
cloud_box("CloudB", (560, 1500, -250), (700, 420, 95), 11.7, 1.30, 0.04, -0.35)
# nappe lointaine sur l'horizon

bpy.ops.render.render(write_still=True)
print("RENDERED", OUT)
