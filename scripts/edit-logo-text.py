"""
Substitui 'GERENCIAMENTO' por 'CONSULTORIA' no logo, mantendo o estilo visual.
Fonte usada: Impact (similar ao original bold 3D).
"""
from PIL import Image, ImageDraw, ImageFont
import sys

SRC  = r"C:\Users\Italo\Downloads\WhatsApp Image 2026-05-25 at 20.23.55.jpeg"
DST  = r"C:\Users\Italo\WMS\public\logo.png"

img = Image.open(SRC).convert("RGBA")
w, h = img.size  # 1254 x 1254

draw = ImageDraw.Draw(img)

# ---- 1. Cobrir toda a metade inferior (traços + texto) com branco ----
y_top    = int(h * 0.78)
y_bottom = h
draw.rectangle([0, y_top, w, y_bottom], fill=(255, 255, 255, 255))

# ---- 3. Escrever "CONSULTORIA" ----
# Fontes disponíveis no Windows (em ordem de preferência)
font_paths = [
    r"C:\Windows\Fonts\impact.ttf",
    r"C:\Windows\Fonts\arialbd.ttf",
    r"C:\Windows\Fonts\ariblk.ttf",
]
font = None
for fp in font_paths:
    try:
        font = ImageFont.truetype(fp, size=int(h * 0.095))
        break
    except Exception:
        continue
if font is None:
    font = ImageFont.load_default()

text = "CONSULTORIA"

# Bounding box do texto para centralizar
bbox = draw.textbbox((0, 0), text, font=font)
tw = bbox[2] - bbox[0]
th = bbox[3] - bbox[1]
tx = (w - tw) // 2
center_zone = y_top + int((h - y_top) * 0.52)
ty = center_zone - th // 2

# Contorno escuro para legibilidade
OUTLINE = (0, 60, 0, 255)
for ox, oy in [(-3,-3),(3,-3),(-3,3),(3,3),(0,-3),(0,3),(-3,0),(3,0)]:
    draw.text((tx + ox, ty + oy), text, font=font, fill=OUTLINE)

# Sombra clara para profundidade
for ox, oy in [(-1,-1),(1,-1),(-1,1),(1,1)]:
    draw.text((tx + ox, ty + oy), text, font=font, fill=(180, 230, 140, 200))

# Texto verde principal brilhante
GREEN = (80, 200, 40, 255)
draw.text((tx, ty), text, font=font, fill=GREEN)

# ---- 4. Redesenhar os traços azuis lateralizando "CONSULTORIA" ----
LINE_COLOR = (26, 63, 160, 255)
line_y = ty + th // 2 + 6
line_h = max(3, int(h * 0.006))
margin = int(w * 0.04)
gap    = int(tw * 0.54)   # metade do texto + folga

# traço esquerdo
draw.rectangle([margin, line_y, (w - tw) // 2 - int(w * 0.02), line_y + line_h], fill=LINE_COLOR)
# traço direito
draw.rectangle([(w + tw) // 2 + int(w * 0.02), line_y, w - margin, line_y + line_h], fill=LINE_COLOR)

# ---- 5. Remover fundo branco → transparência ----
px = img.load()
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        mx, mn = max(r, g, b), min(r, g, b)
        if mx > 235 and (mx - mn) < 18:
            px[x, y] = (r, g, b, 0)
        elif mx > 205 and (mx - mn) < 14:
            alpha = int(255 * (mx - 205) / 30)
            px[x, y] = (r, g, b, 255 - alpha)

# ---- 6. Recortar e redimensionar ----
bbox_final = img.getbbox()
if bbox_final:
    img = img.crop(bbox_final)
img.thumbnail((512, 512), Image.LANCZOS)
img.save(DST, "PNG")
print("Salvo:", DST, img.size)
