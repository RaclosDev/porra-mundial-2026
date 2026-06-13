import json
import re

with open('annex_c_matrix.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract object
match = re.search(r'const annexCMatrix = (\{.*\});', content, re.DOTALL)
if match:
    obj_str = match.group(1)
    # Simple eval replacing logic to parse JS object in python is hard, let's just count keys
    keys = re.findall(r'"([A-L]{8})":', obj_str)
    print(f"Total keys: {len(keys)}")
    print(f"Unique keys: {len(set(keys))}")
    print(keys[:5])
