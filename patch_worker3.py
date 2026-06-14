import sys
with open(r'C:\Users\raclo\.gemini\antigravity-ide\brain\6d3e17ed-bc2a-4d0f-82e8-a8e103f668c1\.system_generated\logs\transcript.jsonl', encoding='utf-8') as f:
    for line in f:
        if 'step_index":6728' in line or 'step_index":6729' in line:
            print(line.encode('ascii', 'ignore').decode()[:3000])
