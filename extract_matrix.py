import urllib.request
from pypdf import PdfReader
import json
import re

pdf_path = "FWC2026_regulations_EN.pdf"
reader = PdfReader(pdf_path)

combinations_map = {}

pattern = re.compile(r"^(\d{1,3})\s+3([A-L])\s+3([A-L])\s+3([A-L])\s+3([A-L])\s+3([A-L])\s+3([A-L])\s+3([A-L])\s+3([A-L])")

for i, page in enumerate(reader.pages):
    text = page.extract_text()
    for line in text.split('\n'):
        clean_line = re.sub(r'\s+', ' ', line).strip()
        match = pattern.match(clean_line)
        if match:
            comb_num = match.group(1)
            teams = [match.group(i) for i in range(2, 10)]
            
            # The columns are: 1A, 1B, 1D, 1E, 1G, 1I, 1K, 1L
            mapping = {
                "1A": teams[0],
                "1B": teams[1],
                "1D": teams[2],
                "1E": teams[3],
                "1G": teams[4],
                "1I": teams[5],
                "1K": teams[6],
                "1L": teams[7]
            }
            
            # The key will be the sorted string of the 8 groups
            key = "".join(sorted(teams))
            combinations_map[key] = mapping

# Generate a JS file that exports this map
js_content = "const annexCMatrix = " + json.dumps(combinations_map, indent=2) + ";\n"

with open("annex_c_matrix.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"Extracted {len(combinations_map)} combinations and saved to annex_c_matrix.js.")
