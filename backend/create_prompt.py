def generate_pain_description(pain_type, intensity, location, duration, depth, color, shape, border, texture_touch, texture_stroke, texture_hold):
    # Determine pain creature or ghost
    pain_entity = "creature" if pain_type == "physical" else "ghost"

    # Intensity description
    intensity_levels = {
        0: "indifferent",
        1: "apathetic",
        2: "uninterested",
        3: "disinterested",
        4: "bored",
        5: "uneasy",
        6: "worried",
        7: "anxious",
        8: "agitated",
        9: "angry",
        10: "furious"
    }
    intensity_desc = intensity_levels.get(intensity, "unknown")
    
    # Short or tall
    size = "short" if duration <= 5 else "tall"

    # Thin or thick
    thickness = "thin" if depth <= 5 else "thick"

    # Shape
    shapes = {
        1: "rounded",
        2: "soft",
        3: "nothing",
        4: "defined",
        5: "sharp"
    }
    shape_desc = shapes.get(shape, "undefined")

    # Border
    border_desc = "" if border == "defined" else "blurred into the background"

    # Texture
    texture_types = {
        (1, 2): "watery",
        (3, 4): "runny",
        (5, 5): "syrupy",
        (4, 5): "creamy with soft texture",
        (4, 4): "bumpy slime",
        (4, 5): "glossy",
        (4, 4): "gritty"
    }
    texture_desc = texture_types.get((texture_touch, texture_stroke), "undefined texture")

    # Additional features based on combinations
    if thickness == "thin" and texture_touch in (1, 2) and texture_stroke in (1, 2):
        feature = "runny/watery/bloby"
    elif thickness == "thin" and texture_touch in (4, 5) and texture_stroke in (4, 5):
        feature = "brittle scales"
    elif thickness == "thick" and texture_touch in (1, 2) and texture_stroke in (1, 2):
        feature = "creamy with soft texture"
    elif thickness == "thick" and texture_touch in (4, 5) and texture_stroke in (4, 5):
        feature = "bumpy slime"
    else:
        feature = "no distinct feature"

    # Build the sentence
    description = (
        f"Animated {pain_entity} in Pixar-art style that is {intensity_desc} and has {location}. "
        f"It is {size} and {thickness}. {color} colors. "
        f"The creature is {shape_desc}, {texture_desc}, {border_desc} and has {feature}."
    )

    return description


# Example Usage
description = generate_pain_description(
    pain_type="physical", 
    intensity=9,#23
    location="lower back pain", #63
    duration=4, #64
    depth=6, #71
    color="red", #72
    shape=5, #73
    border="blurred", #74
    texture_touch=4, #75
    texture_stroke=5, #76
    texture_hold=2 #77
)

print(description)
