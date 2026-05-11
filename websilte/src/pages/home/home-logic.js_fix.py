import sys

def fix_mojibake(text):
    try:
        # The text was UTF-8 bytes interpreted as CP874 and then saved as UTF-8 again.
        # So we encode it back to CP874 to get the original bytes, then decode as UTF-8.
        return text.encode('cp874').decode('utf-8')
    except Exception as e:
        # If it fails, it might be already correct or contain characters that aren't mojibake
        return text

file_path = r'd:\testing-tikekt\websilte\src\pages\home\home-logic.js'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

fixed_lines = []
for line in lines:
    # We only want to fix the parts that are actually mojibake.
    # Usually these are inside strings or comments.
    # But for simplicity, we can try to fix the whole line if it looks like it has mojibake.
    # However, some characters like '—' (EM DASH) or '──' might cause issues if they aren't part of the mojibake.
    
    # Let's try to fix the whole line and see if it makes sense.
    try:
        fixed_line = line.encode('cp874').decode('utf-8')
        fixed_lines.append(fixed_line)
    except:
        fixed_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(fixed_lines)

print("Done")
