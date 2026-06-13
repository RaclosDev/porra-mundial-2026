import re

with open('full_html.txt', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract names using regex
names = re.findall(r'label-text">([^<]+)</div>', html)

# Remove duplicates while preserving order
seen = set()
unique_names = []
for name in names:
    if name not in seen:
        seen.add(name)
        unique_names.append(name)

top_50 = unique_names[:50]

print(f"Found {len(top_50)} names.")

# Generate HTML options
options_html = '<option value="">Selecciona un jugador...</option>\n'
for name in top_50:
    options_html += f'                        <option value="{name}">{name}</option>\n'

with open('options.html', 'w', encoding='utf-8') as f:
    f.write(options_html)
