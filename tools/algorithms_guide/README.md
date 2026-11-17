# «Алгоритми наживо» — вихідники

Інтерактивний гайд з алгоритмів `module_3/bonus/Алгоритми наживо.html` збирається з цієї папки.
HTML-файл самодостатній (усе вбудовано, ззовні — лише шрифт IBM Plex), тож його можна просто відкрити в браузері.
**Не редагуй HTML вручну** — зміни зникнуть після наступної збірки. Правки — тут, потім збірка.

## Збірка й перевірка

```bash
python tools/algorithms_guide/assemble.py                     # → module_3/bonus/Алгоритми наживо.html
for f in tools/algorithms_guide/checks/check_*.py; do python "$f"; done   # Python-код, показаний у гайді
python tools/algorithms_guide/browser_check.py "module_3/bonus/Алгоритми наживо.html"   # анімації в браузері
```

`browser_check.py` потребує `pip install playwright && playwright install chromium`.

## Як влаштовано

| Файл | Що в ньому |
|---|---|
| `assemble.py` | збирач; список `CHAPTERS` задає розділи меню й порядок секцій |
| `base_head.html` | `<head>` і базові стилі (кольори, світла/темна тема, картки, код) |
| `extra.css` | стилі навігації, прогнозів, посилань на курс, дерев і графів |
| `helpers.js` | спільні хелпери: `Runner` (крокування по генератору), `controls`, `flow`, `code`/`codeOn`, `chips`, `treeSvg`, `graphSvg`, `both`, `course` і словник `COURSE` з посиланнями на уроки |
| `nav.js` | дворівнева навігація (розділ → алгоритм), кнопки «попередній / наступний», `#id` в адресі |
| `frag_<name>.html/.js/.css` | секції: `base` (карта, дублікати, шпаргалка), `orig` (перші сім тем), `search`, `recdp`, `linear`, `treegraph` |
| `checks/check_<name>.py` | увесь Python-код, показаний у фрагменті, з `assert` |

## Додати тему

1. Секція у `frag_<name>.html`: `<section class="lesson" id="ID" data-title="Назва у меню">` — `h2`, `p.lead` (задача з курсу → ідея), `details.predict` (🔮 прогноз), `div.grid` з демо, складністю й кодом, `<div class="course" id="ID-course">`. Усі id всередині — з префіксом `ID-`.
2. IIFE у `frag_<name>.js`: генератор станів → `new Runner(make, render)` → `controls(...)`; `codeOn` — номер рядка з 0; генератор має завершуватися; `course($('#ID-course'), ['l12', ...])`.
3. Додай `ID` у `CHAPTERS` в `assemble.py`, а показаний Python — у `checks/check_<name>.py`.
4. Збери й прожени обидві перевірки.

Правила змісту: усе українською; без згадок старого курсу й старих номерів уроків (бонусні уроки — лише через ключі `COURSE`).
