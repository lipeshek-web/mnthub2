import pathlib

s = pathlib.Path('src/app/api/reminders/run/route.ts').read_text()
probe = chr(91) + 'm'
bad = [i + 1 for i, l in enumerate(s.splitlines()) if probe in l]
print('CORROMPIDO linhas', bad) if bad else print('OK')
