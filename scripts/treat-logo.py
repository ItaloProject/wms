"""Remove o fundo branco do logo e recorta as bordas, gerando public/logo.png."""
import sys
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]

img = Image.open(src).convert("RGBA")
px = img.load()
w, h = img.size

for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        # luminosidade alta e baixa saturação = fundo branco/cinza claro
        mx, mn = max(r, g, b), min(r, g, b)
        if mx > 235 and (mx - mn) < 18:
            px[x, y] = (r, g, b, 0)
        elif mx > 200 and (mx - mn) < 12:
            # meio-tom da sombra/serrilhado: deixa semitransparente
            px[x, y] = (r, g, b, int(255 * (235 - mx) / 35) if mx < 235 else 0)

# recorta a área útil
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)

# limita o tamanho para uso na web
img.thumbnail((512, 512), Image.LANCZOS)
img.save(dst, "PNG")
print("ok:", dst, img.size)
