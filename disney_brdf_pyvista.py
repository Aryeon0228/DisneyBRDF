"""
Disney BRDF Interactive Demo with PyVista
Real-time PBR material parameter adjustment

Requirements:
    pip install pyvista

Usage:
    python disney_brdf_pyvista.py

Features:
    - Real-time PBR material preview with full Disney BRDF parameter set
    - Interactive sliders for 8 Disney BRDF parameters:
        * Base Color (RGB)
        * Metallic
        * Roughness  
        * Specular (mapped to IOR 1.0-1.8)
        * Anisotropic
        * Anisotropic Rotation
        * Clearcoat
        * Clearcoat Roughness
    - Material presets (Gold, Chrome, Plastic, Rubber, Wood, Car Paint, Brushed Metal)
    - Smooth shading with multiple colored lights
    - Based on the Disney "Principled" BRDF model (Burley 2012)
"""

import pyvista as pv
import numpy as np

# Disney BRDF Parameters
params = {
    'base_color': [0.5, 0.5, 0.5],  # RGB
    'metallic': 0.0,
    'roughness': 0.5,
    'specular': 0.5,  # Maps to IOR (0.5 = IOR 1.5)
    'anisotropic': 0.0,
    'anisotropic_rotation': 0.0,
    'clearcoat': 0.0,
    'clearcoat_roughness': 0.0,
}

# Create meshes
sphere = pv.Sphere(radius=1.0, theta_resolution=60, phi_resolution=60)
sphere.points[:, 0] -= 2.5  # Move left

# Create parametric torus knot manually
def create_torus_knot(p=2, q=3, resolution=100):
    """Create a torus knot mesh"""
    t = np.linspace(0, 2*np.pi, resolution)
    
    # Torus knot parametric equations
    r = np.cos(q * t) + 2
    x = r * np.cos(p * t)
    y = r * np.sin(p * t)
    z = -np.sin(q * t)
    
    # Create tube around the curve
    points = np.column_stack([x, y, z])
    return pv.Spline(points, resolution * 2).tube(radius=0.3, n_sides=20)

torus_knot = create_torus_knot()
torus_knot.points[:, 0] += 2.5  # Move right

# Create plotter
plotter = pv.Plotter()
plotter.set_background('#1a1a2e')

# Add meshes with PBR properties
sphere_actor = plotter.add_mesh(
    sphere,
    color=params['base_color'],
    pbr=True,
    metallic=params['metallic'],
    roughness=params['roughness'],
    smooth_shading=True
)

torus_actor = plotter.add_mesh(
    torus_knot,
    color=params['base_color'],
    pbr=True,
    metallic=params['metallic'],
    roughness=params['roughness'],
    smooth_shading=True
)

# Add lights for better PBR rendering
light1 = pv.Light(position=(5, 5, 5), light_type='scene light', intensity=1.0)
light2 = pv.Light(position=(-5, -3, 3), light_type='scene light', intensity=0.6, color=(0.6, 0.7, 1.0))
light3 = pv.Light(position=(0, -5, -3), light_type='scene light', intensity=0.4, color=(1.0, 0.8, 0.6))

plotter.add_light(light1)
plotter.add_light(light2)
plotter.add_light(light3)

# Enable environment texture for metallic reflections
plotter.enable_ssao()  # Screen Space Ambient Occlusion for better depth

# Camera setup
plotter.camera_position = [(0, 0, 10), (0, 0, 0), (0, 1, 0)]


def update_materials():
    """Update both actors with current parameters"""
    # Convert base_color list to tuple
    color = tuple(params['base_color'])
    
    # Disney BRDF specular parameter maps to IOR
    # Range: 0.0-1.0 maps to IOR 1.0-1.8
    # Middle value 0.5 = IOR 1.5 (most common)
    ior = 1.0 + params['specular'] * 0.8
    
    # Update sphere
    sphere_actor.GetProperty().SetColor(color)
    sphere_actor.GetProperty().SetMetallic(params['metallic'])
    sphere_actor.GetProperty().SetRoughness(params['roughness'])
    sphere_actor.GetProperty().SetBaseIOR(ior)
    sphere_actor.GetProperty().SetAnisotropy(params['anisotropic'])
    sphere_actor.GetProperty().SetAnisotropyRotation(params['anisotropic_rotation'])
    sphere_actor.GetProperty().SetCoatStrength(params['clearcoat'])
    sphere_actor.GetProperty().SetCoatRoughness(params['clearcoat_roughness'])
    
    # Update torus knot
    torus_actor.GetProperty().SetColor(color)
    torus_actor.GetProperty().SetMetallic(params['metallic'])
    torus_actor.GetProperty().SetRoughness(params['roughness'])
    torus_actor.GetProperty().SetBaseIOR(ior)
    torus_actor.GetProperty().SetAnisotropy(params['anisotropic'])
    torus_actor.GetProperty().SetAnisotropyRotation(params['anisotropic_rotation'])
    torus_actor.GetProperty().SetCoatStrength(params['clearcoat'])
    torus_actor.GetProperty().SetCoatRoughness(params['clearcoat_roughness'])
    
    plotter.render()


def create_slider(name, min_val, max_val, value, pointa, pointb, callback):
    """Helper function to create sliders"""
    return plotter.add_slider_widget(
        callback,
        [min_val, max_val],
        value=value,
        title=name,
        pointa=pointa,
        pointb=pointb,
        style='modern'
    )


# Slider callbacks
def update_metallic(value):
    params['metallic'] = value
    update_materials()

def update_roughness(value):
    params['roughness'] = value
    update_materials()

def update_specular(value):
    params['specular'] = value
    update_materials()

def update_anisotropic(value):
    params['anisotropic'] = value
    update_materials()

def update_anisotropic_rotation(value):
    params['anisotropic_rotation'] = value
    update_materials()

def update_clearcoat(value):
    params['clearcoat'] = value
    update_materials()

def update_clearcoat_roughness(value):
    params['clearcoat_roughness'] = value
    update_materials()

def update_base_color_r(value):
    params['base_color'][0] = value
    update_materials()

def update_base_color_g(value):
    params['base_color'][1] = value
    update_materials()

def update_base_color_b(value):
    params['base_color'][2] = value
    update_materials()


# Add sliders
# Base Color sliders
create_slider('Red', 0.0, 1.0, params['base_color'][0], 
              (0.02, 0.95), (0.3, 0.95), update_base_color_r)
create_slider('Green', 0.0, 1.0, params['base_color'][1], 
              (0.02, 0.90), (0.3, 0.90), update_base_color_g)
create_slider('Blue', 0.0, 1.0, params['base_color'][2], 
              (0.02, 0.85), (0.3, 0.85), update_base_color_b)

# Material parameter sliders
create_slider('Metallic', 0.0, 1.0, params['metallic'], 
              (0.02, 0.75), (0.3, 0.75), update_metallic)
create_slider('Roughness', 0.0, 1.0, params['roughness'], 
              (0.02, 0.70), (0.3, 0.70), update_roughness)
create_slider('Specular (IOR)', 0.0, 1.0, params['specular'], 
              (0.02, 0.65), (0.3, 0.65), update_specular)
create_slider('Anisotropic', 0.0, 1.0, params['anisotropic'], 
              (0.02, 0.60), (0.3, 0.60), update_anisotropic)
create_slider('Aniso Rotation', 0.0, 1.0, params['anisotropic_rotation'], 
              (0.02, 0.55), (0.3, 0.55), update_anisotropic_rotation)
create_slider('Clearcoat', 0.0, 1.0, params['clearcoat'], 
              (0.02, 0.50), (0.3, 0.50), update_clearcoat)
create_slider('Clearcoat Rough', 0.0, 1.0, params['clearcoat_roughness'], 
              (0.02, 0.45), (0.3, 0.45), update_clearcoat_roughness)


# Preset buttons
def apply_preset(preset_name):
    """Apply material presets"""
    presets = {
        'gold': {
            'color': [1.0, 0.7, 0.3], 
            'metallic': 1.0, 
            'roughness': 0.2,
            'specular': 0.5,
            'anisotropic': 0.0,
            'clearcoat': 0.0
        },
        'chrome': {
            'color': [0.88, 0.88, 0.88], 
            'metallic': 1.0, 
            'roughness': 0.05,
            'specular': 0.5,
            'anisotropic': 0.0,
            'clearcoat': 0.0
        },
        'plastic': {
            'color': [0.8, 0.2, 0.2], 
            'metallic': 0.0, 
            'roughness': 0.3,
            'specular': 0.5,
            'anisotropic': 0.0,
            'clearcoat': 0.5
        },
        'rubber': {
            'color': [0.15, 0.15, 0.15], 
            'metallic': 0.0, 
            'roughness': 0.9,
            'specular': 0.5,
            'anisotropic': 0.0,
            'clearcoat': 0.0
        },
        'wood': {
            'color': [0.42, 0.2, 0.06], 
            'metallic': 0.0, 
            'roughness': 0.7,
            'specular': 0.5,
            'anisotropic': 0.0,
            'clearcoat': 0.1
        },
        'car_paint': {
            'color': [0.8, 0.0, 0.0],
            'metallic': 0.0,
            'roughness': 0.1,
            'specular': 0.5,
            'anisotropic': 0.0,
            'clearcoat': 1.0
        },
        'brushed_metal': {
            'color': [0.7, 0.7, 0.7],
            'metallic': 1.0,
            'roughness': 0.3,
            'specular': 0.5,
            'anisotropic': 0.8,
            'clearcoat': 0.0
        },
    }
    
    if preset_name in presets:
        preset = presets[preset_name]
        params['base_color'] = preset['color']
        params['metallic'] = preset['metallic']
        params['roughness'] = preset['roughness']
        params['specular'] = preset.get('specular', 0.5)
        params['anisotropic'] = preset.get('anisotropic', 0.0)
        params['anisotropic_rotation'] = 0.0
        params['clearcoat'] = preset.get('clearcoat', 0.0)
        params['clearcoat_roughness'] = 0.0
        update_materials()
        print(f"Applied preset: {preset_name}")


# Add text instructions
plotter.add_text(
    "Disney BRDF Demo\nDrag to rotate • Scroll to zoom\nUse sliders to adjust parameters",
    position='upper_right',
    font_size=10,
    color='white'
)

# Note about keyboard shortcuts
print("\n" + "="*60)
print("Disney BRDF Interactive Demo - Full Parameter Set")
print("="*60)
print("\nPresets (type in terminal, then press Enter):")
print("  - apply_preset('gold')")
print("  - apply_preset('chrome')")
print("  - apply_preset('plastic')")
print("  - apply_preset('rubber')")
print("  - apply_preset('wood')")
print("  - apply_preset('car_paint')     # Red car paint with clearcoat")
print("  - apply_preset('brushed_metal')  # Anisotropic metal")
print("\nDisney BRDF Parameters:")
print("  ✓ Base Color (RGB)")
print("  ✓ Metallic")
print("  ✓ Roughness")
print("  ✓ Specular (IOR 1.0-1.8)")
print("  ✓ Anisotropic")
print("  ✓ Anisotropic Rotation")
print("  ✓ Clearcoat")
print("  ✓ Clearcoat Roughness")
print("\nControls:")
print("  - Left click + drag: Rotate")
print("  - Right click + drag: Pan")
print("  - Scroll: Zoom")
print("  - Use sliders on left side to adjust parameters")
print("\nClose window to exit.")
print("="*60 + "\n")

# Show the interactive window
plotter.show()
