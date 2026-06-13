import json
import base64
import urllib.parse
import urllib.request
import sys

db_url = "https://porra-mundial-2026-6d233-default-rtdb.europe-west1.firebasedatabase.app/bets.json"

# Fetch all bets
req = urllib.request.Request(db_url)
try:
    with urllib.request.urlopen(req) as response:
        bets = json.loads(response.read().decode('utf-8'))
except Exception as e:
    print(f"Error fetching bets: {e}")
    sys.exit(1)

chill_bro_key = None
chill_bro_hash = None
chill_bro_obj = None

for key, val in bets.items():
    hash_str = val.get('hash')
    if not hash_str: continue
    
    try:
        # decode base64 -> unescape -> decodeURIComponent (which we do by just unquote after b64decode because JS btoa(unescape(encodeURIComponent(str))) == btoa(unescape(encodeURIComponent)) is roughly utf8 base64)
        # Actually JS: btoa(unescape(encodeURIComponent(str)))
        # Python: base64.b64decode(hash_str).decode('utf-8')
        json_str = base64.b64decode(hash_str).decode('utf-8')
        obj = json.loads(json_str)
        
        if obj.get('user') == 'Chill bro':
            chill_bro_key = key
            chill_bro_hash = hash_str
            chill_bro_obj = obj
            
    except Exception as e:
        pass

if chill_bro_key and chill_bro_obj:
    # Fix Group J
    groups = chill_bro_obj.get('groups', {})
    if 'J' in groups and len(groups['J']) == 3:
        if groups['J'][2] == "Arabia Saudí":
            groups['J'][2] = "Argelia"
            print("Fixed Chill bro locally.")
            
            # Recalculate hash
            new_json_str = json.dumps(chill_bro_obj, separators=(',', ':'))
            # python equivalent of btoa(unescape(encodeURIComponent(str)))
            # encodeURIComponent encodes to utf-8 hex chars. unescape decodes hex chars to raw bytes. btoa encodes raw bytes to b64.
            # This is exactly equivalent to utf-8 encoding then base64 encoding.
            new_hash = base64.b64encode(new_json_str.encode('utf-8')).decode('utf-8')
            
            # Update Firebase
            update_url = f"https://porra-mundial-2026-6d233-default-rtdb.europe-west1.firebasedatabase.app/bets/{chill_bro_key}.json"
            # PATCH request
            patch_data = json.dumps({"hash": new_hash}).encode('utf-8')
            patch_req = urllib.request.Request(update_url, data=patch_data, method='PATCH')
            patch_req.add_header('Content-Type', 'application/json')
            try:
                urllib.request.urlopen(patch_req)
                print("Updated Chill bro in Firebase.")
            except Exception as e:
                print(f"Failed to update Firebase: {e}")
                
# Now re-fetch to validate everything
req = urllib.request.Request(db_url)
with urllib.request.urlopen(req) as response:
    bets = json.loads(response.read().decode('utf-8'))

print("\n--- VALIDATING ALL BETS ---")
for key, val in bets.items():
    hash_str = val.get('hash')
    if not hash_str: continue
    
    try:
        json_str = base64.b64decode(hash_str).decode('utf-8')
        obj = json.loads(json_str)
        user = obj.get('user', 'Unknown')
        
        missing = []
        
        # Check groups
        groups = obj.get('groups', {})
        if len(groups) != 12: missing.append(f"Solo tiene {len(groups)} grupos (faltan algunos)")
        for g, teams in groups.items():
            if len(teams) != 3:
                missing.append(f"Grupo {g} no tiene 3 clasificados (tiene {len(teams)})")
                
        # Check thirds
        thirds = obj.get('thirds', [])
        if len(thirds) != 8:
            missing.append(f"No tiene 8 terceros (tiene {len(thirds)})")
            
        # Check brackets
        r32 = obj.get('r32', [])
        if len(r32) != 16: missing.append(f"R32 tiene {len(r32)} partidos")
        
        r16 = obj.get('r16', [])
        if len(r16) != 8: missing.append(f"R16 tiene {len(r16)} partidos")
        
        qf = obj.get('qf', [])
        if len(qf) != 4: missing.append(f"QF tiene {len(qf)} partidos")
        
        sf = obj.get('sf', [])
        if len(sf) != 2: missing.append(f"SF tiene {len(sf)} partidos")
        
        final = obj.get('final', [])
        if len(final) != 2: missing.append(f"Final tiene {len(final)} equipos")
        
        champion = obj.get('champion')
        if not champion: missing.append("No tiene Campeón")
        
        scorer = obj.get('scorer')
        if not scorer: missing.append("No tiene Goleador")
        
        # We ignore thirdPlaceWinner because we already know 5 people are missing it, 
        # but the user asked "comprueba que no falte ningun dato a ninguno" so let's report it
        third_place_match = obj.get('thirdPlaceMatch', [])
        if len(third_place_match) != 2: missing.append(f"Partido por 3er puesto tiene {len(third_place_match)} equipos")
        
        third_place_winner = obj.get('thirdPlaceWinner')
        if not third_place_winner: missing.append("No tiene Ganador del 3er puesto")
        
        if missing:
            print(f"- {user}: {', '.join(missing)}")
            
    except Exception as e:
        print(f"Error decoding for key {key}: {e}")
