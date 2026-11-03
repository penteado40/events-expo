import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import FILES
import s_group, s_event, s_rest
s_group.build(); s_event.build(); s_rest.build()
out = sys.argv[1]
for n, f in FILES.items():
  open(os.path.join(out, n + '.dc.html'), 'w').write(f['html'])
json.dump({n: dict(title=f['title'], h=f['h']) for n, f in FILES.items()}, open(os.path.join(out, '..', 'manifest.json'), 'w'), ensure_ascii=False)
print(len(FILES))
