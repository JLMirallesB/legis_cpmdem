#!/usr/bin/env python3
"""
Hipervínculos de un PDF con el texto visible que los lleva.

    python3 scripts/pdf-hidden-links.py norma.pdf            # todos
    python3 scripts/pdf-hidden-links.py norma.pdf --ocultos  # solo si el texto no es la URL
    python3 scripts/pdf-hidden-links.py norma.pdf --json data/laws/es/slug.json
        # solo los que no aparecen ya en el JSON ingestado

Sirve para encontrar los enlaces que el PDF esconde tras un texto (un nombre de
proyecto, el UUID de un documento…) y que la extracción de texto pierde. En el
JSON se transcriben como `[texto visible](url)`: ver «Hipervínculos ocultos»
en CLAUDE.md.

Necesita pypdf (está en el Python del sistema) y pdftotext (poppler).
Un hipervínculo que ocupa dos líneas sale como dos filas, una por rectángulo.
"""
import html
import re
import subprocess
import sys

from pypdf import PdfReader


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)
    pdf = args[0]
    solo_ocultos = "--ocultos" in args
    json_text = None
    if "--json" in args:
        json_text = open(args[args.index("--json") + 1], encoding="utf-8").read()

    reader = PdfReader(pdf)
    bbox = subprocess.run(["pdftotext", "-bbox", pdf, "-"], capture_output=True, text=True, check=True).stdout
    pages = re.findall(r'<page width="([\d.]+)" height="([\d.]+)">(.*?)</page>', bbox, re.S)

    for pi, page in enumerate(reader.pages):
        height = float(pages[pi][1])
        words = [
            (float(a), float(b), float(c), float(d), html.unescape(t))
            for a, b, c, d, t in re.findall(
                r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</word>', pages[pi][2]
            )
        ]
        for annot in page.get("/Annots") or []:
            annot = annot.get_object()
            action = annot.get("/A")
            if not action:
                continue
            uri = action.get_object().get("/URI")
            if not uri:
                continue
            x0, y0, x1, y1 = (float(v) for v in annot["/Rect"])
            top, bottom = height - y1, height - y0
            text = " ".join(
                w[4] for w in words if w[0] >= x0 - 2 and w[2] <= x1 + 2 and w[1] >= top - 2 and w[3] <= bottom + 2
            )
            if solo_ocultos and re.match(r"^\(?(https?://|www\.)", text):
                continue
            if json_text is not None and uri.split("?")[0] in json_text:
                continue
            print(f"p.{pi + 1}\t{text!r}\t{uri}")


if __name__ == "__main__":
    main()
