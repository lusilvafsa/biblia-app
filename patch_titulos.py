arq = 'www/js/features/bible/reader.js'
c = open(arq, encoding='utf-8').read()

old1 = """    verses.forEach((text, idx) => {
      const p = el('p', { className: 'verse-line' }, ["""
new1 = """    // Títulos de passagem (opcionais): data/titles/<livro>.json
    let chapterTitles = {};
    try {
      window.__titlesCache = window.__titlesCache || {};
      if (!window.__titlesCache[bookIndex]) {
        const resp = await fetch('data/titles/' + bookIndex + '.json');
        window.__titlesCache[bookIndex] = resp.ok ? await resp.json() : {};
      }
      chapterTitles = window.__titlesCache[bookIndex][String(chapterIndex + 1)] || {};
    } catch (e) {
      chapterTitles = {};
    }
    verses.forEach((text, idx) => {
      const p = el('p', { className: 'verse-line' }, ["""

old2 = """      readContent.appendChild(p);
      verseEls.push(p);"""
new2 = """      if (chapterTitles[String(idx + 1)]) {
        const h = el('h3', { className: 'pericope-title' }, chapterTitles[String(idx + 1)]);
        h.style.cssText = 'margin:20px 0 6px;font-weight:700;opacity:.85;font-size:' + Math.round(settings.fontSize * 0.95) + 'px;';
        readContent.appendChild(h);
      }
      readContent.appendChild(p);
      verseEls.push(p);"""

if c.count(old1) != 1:
    raise SystemExit('old1 não bateu: ' + str(c.count(old1)))
if c.count(old2) != 1:
    raise SystemExit('old2 não bateu: ' + str(c.count(old2)))

c = c.replace(old1, new1).replace(old2, new2)
open(arq, 'w', encoding='utf-8').write(c)
print('Patch aplicado com sucesso')
