"""Збирає «Алгоритми наживо» з фрагментів у module_3/bonus/Алгоритми наживо.html.

    python tools/algorithms_guide/assemble.py                    # повний гайд у репо
    python tools/algorithms_guide/assemble.py --only search --out /tmp/t.html   # один фрагмент

У збірку йдуть усі frag_<name>.html / .js / .css з цієї папки. Порядок секцій і розділи — CHAPTERS."""
import glob, json, os, re, sys
D = os.path.dirname(os.path.abspath(__file__))
CHAPTERS = [
    ("start", "Старт", ["kart", "bigo", "dupl"]),
    ("search", "Пошук", ["poshuk", "bisect", "twoptr", "window"]),
    ("hash", "Хешування", ["hashtable", "twosum", "anagram"]),
    ("rec", "Рекурсія", ["callstack", "backtrack"]),
    ("sort", "Сортування", ["sortuvannya", "sortrace"]),
    ("dp", "Жадібні і ДП", ["zhadibnyi", "intervals", "wis", "dp", "coindp"]),
    ("lin", "Списки, стеки, черги", ["arrlist", "revlist", "brackets", "queue", "windowmax"]),
    ("tree", "Дерева, купи, кеші", ["bst", "traverse", "heap", "trie", "lru"]),
    ("graph", "Графи", ["hrafy", "dijkstra", "bellman"]),
    ("heur", "Евристики", ["henetyka"]),
    ("cheat", "Шпаргалка", ["cheat"]),
]
args = sys.argv[1:]
only = None
out = os.path.join(D, "..", "..", "module_3", "bonus", "Алгоритми наживо.html")
if "--only" in args: only = ["orig", "base"] + args[args.index("--only") + 1].split(",")
if "--out" in args: out = args[args.index("--out") + 1]
names = sorted({os.path.basename(p)[5:].rsplit(".", 1)[0] for p in glob.glob(os.path.join(D, "frag_*.*"))})
names = sorted(names, key=lambda n: (n not in ("base", "orig"), n))
if only: names = [n for n in names if n in only]
read = lambda p: open(p, encoding="utf-8").read() if os.path.exists(p) else ""
sections = {}
for n in names:
    for m in re.finditer(r'<section class="lesson" id="([^"]+)".*?</section>', read(os.path.join(D, f"frag_{n}.html")), re.S):
        if m.group(1) in sections: sys.exit(f"duplicate section id {m.group(1)} in frag_{n}")
        sections[m.group(1)] = m.group(0)
ordered = [i for _, _, ids in CHAPTERS for i in ids]
missing = [i for i in ordered if i not in sections]
extra = [i for i in sections if i not in ordered]
if extra: sys.exit(f"sections not in CHAPTERS: {extra}")
css = read(os.path.join(D, "extra.css")) + "".join(read(os.path.join(D, f"frag_{n}.css")) for n in names)
js = "".join(f"\n/* ---------- frag_{n} ---------- */\n" + read(os.path.join(D, f"frag_{n}.js")) for n in names)
head = read(os.path.join(D, "base_head.html"))
html = f"""{head}
<style>
{css}</style>

<header class="top"><div class="wrap">
  <h1>Алгоритми наживо</h1>
  <p>Повний інтерактивний гайд з алгоритмів і структур даних курсу: від Big O і пошуку до графів. Кожен алгоритм показано трьома синхронними шарами — схема кроків, рух даних у структурі й рядок коду Python, що виконується саме зараз. «Крок →» — вручну, «▶ Старт» — автоматично.</p>
</div></header>

<nav class="tabs" aria-label="Розділи гайду"><div class="wrap" id="tabbar"></div><div class="wrap sub" id="subbar"></div></nav>

<main class="wrap">
{chr(10).join(sections[i] for i in ordered if i in sections)}
</main>
<footer class="wrap">Алгоритми наживо · повний гайд курсу Python · інтерактивні демонстрації для аудиторії й самостійної роботи</footer>

<script>
(function(){{
'use strict';
{read(os.path.join(D, "helpers.js"))}
const CHAPTERS={json.dumps(CHAPTERS, ensure_ascii=False)};
{js}
{read(os.path.join(D, "nav.js"))}
}})();
</script>

</body></html>
"""
open(out, "w", encoding="utf-8").write(html)
print(f"wrote {os.path.normpath(out)}: {len(sections)} sections, {len(html)//1024} KB; missing: {missing}")
