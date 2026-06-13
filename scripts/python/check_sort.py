import json
import re

with open('annex_c_matrix.js', 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'const annexCMatrix = (\{.*\});', content, re.DOTALL)
if match:
    keys = re.findall(r'"([A-L]{8})":', match.group(1))
    
    unsorted_keys = [k for k in keys if list(k) != sorted(list(k))]
    print(f"Unsorted keys: {len(unsorted_keys)}")
    if unsorted_keys:
        print(unsorted_keys[:5])
