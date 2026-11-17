"""Браузерна перевірка гайду (потрібен playwright: pip install playwright && playwright install chromium).

    python tools/algorithms_guide/browser_check.py "module_3/bonus/Алгоритми наживо.html" [--shots DIR]

Відкриває кожну секцію, проганяє кожну анімацію до кінця (до 4000 кроків), друкує помилки JS.
Свій Chromium: змінна CHROMIUM_PATH. Скріншоти — у світлій і темній темі."""
import os, sys, glob, pathlib
from playwright.sync_api import sync_playwright
EXE = os.environ.get("CHROMIUM_PATH")
page_path = pathlib.Path(sys.argv[1]).resolve().as_uri()
shots = sys.argv[sys.argv.index("--shots") + 1] if "--shots" in sys.argv else None
with sync_playwright() as pw:
    b = pw.chromium.launch(**({"executable_path": EXE} if EXE else {}))
    for theme in (["light", "dark"] if shots else ["light"]):
        pg = b.new_page(viewport={"width": 1280, "height": 900}, color_scheme=theme)
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: m.type == "error" and errs.append("console: " + m.text))
        pg.goto(page_path)
        pg.wait_for_timeout(300)
        print("load errors:", errs)
        ids = pg.eval_on_selector_all("section.lesson", "els => els.map(e => e.id)")
        for sid in ids:
            errs.clear()
            pg.evaluate(f"showSection('{sid}', false)")
            res = pg.evaluate("""sid => { const out = [];
              const sec = document.getElementById(sid);
              for (const btn of sec.querySelectorAll('.controls .btn.primary')) {
                const host = btn.closest('.controls'); const idp = btn.id.replace(/-play$/, '');
                const step = document.getElementById(idp + '-step');
                let k = 0; document.getElementById(idp + '-reset').click();
                while (!step.disabled && k < 4000) { step.click(); k++; }
                out.push(idp + ':' + k + (step.disabled ? '' : '(cap)'));
              } return out.join(' '); }""", sid)
            if shots and theme == "light":
                pg.evaluate(f"""sid => {{ const sec=document.getElementById(sid);
                    for (const btn of sec.querySelectorAll('.controls .btn.primary')) {{ const idp=btn.id.replace(/-play$/,'');
                      document.getElementById(idp+'-reset').click(); for(let i=0;i<12;i++) document.getElementById(idp+'-step').click(); }} }}""", sid)
            if shots:
                os.makedirs(shots, exist_ok=True)
                pg.screenshot(path=f"{shots}/{theme}_{sid}.png", full_page=True)
            print(f"{sid:12s} {res:40s} {'ERR ' + '; '.join(errs) if errs else 'ok'}")
        pg.close()
    b.close()
