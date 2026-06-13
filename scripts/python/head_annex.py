import re
from pypdf import PdfReader

pdf_path = "FWC2026_regulations_EN.pdf"
reader = PdfReader(pdf_path)

with open("head_annex.txt", "w", encoding="utf-8") as f:
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if "1E" in text or "1A" in text or "1I" in text or "1L" in text:
            f.write(f"--- PAGE {i} ---\n")
            lines = text.split('\n')
            for idx, line in enumerate(lines[:50]):
                f.write(f"{idx}: {line}\n")
