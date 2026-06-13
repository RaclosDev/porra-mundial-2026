import json
import base64

with open('C:/Users/raclo/Downloads/porra-mundial-2026-6d233-default-rtdb-export (1).json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for key, val in data.get('bets', {}).items():
    hash_str = val.get('hash')
    if not hash_str: continue
    try:
        json_str = base64.b64decode(hash_str).decode('utf-8')
        obj = json.loads(json_str)
        if obj.get('thirdPlaceWinner') is None:
            print(f"- {obj.get('user')} ({obj.get('bet')})")
    except Exception as e:
        pass
