"""Перевірка прикладів уроку «Патерни програмування».

Запускає кожен блок ```python із design_patterns.md окремим процесом і порівнює
вивід із блоком ```text, що стоїть одразу після нього.
Блоки, що починаються з «# продовження», спираються на попередній блок і пропускаються.

    python check_examples.py            # перевірити документ поруч
    python check_examples.py шлях.md    # перевірити інший файл
"""
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

doc_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).with_name("design_patterns.md")
doc = doc_path.read_text(encoding="utf-8")
blocks = [(m.group(1), m.group(2), doc[:m.start()].count("\n") + 1)
          for m in re.finditer(r"```(\w+)\n(.*?)```", doc, re.S)]

ran = failed = 0
for i, (lang, body, line) in enumerate(blocks):
    if lang != "python" or body.startswith("# продовження"):
        continue
    expected = blocks[i + 1][1] if i + 1 < len(blocks) and blocks[i + 1][0] == "text" else None
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as f:
        f.write(body)
    result = subprocess.run([sys.executable, f.name], capture_output=True, text=True,
                            encoding="utf-8", timeout=60, env={**os.environ, "PYTHONIOENCODING": "utf-8"})
    os.unlink(f.name)
    ran += 1
    if result.returncode != 0:
        failed += 1
        print(f"✗ рядок {line}: код завершився з помилкою\n{result.stderr[-800:]}")
    elif expected is not None and result.stdout.rstrip() != expected.rstrip():
        failed += 1
        print(f"✗ рядок {line}: вивід відрізняється\n--- очікувано\n{expected.rstrip()}\n--- отримано\n{result.stdout.rstrip()}")

print(f"Блоків Python: {ran}, з помилками: {failed}")
sys.exit(1 if failed else 0)
