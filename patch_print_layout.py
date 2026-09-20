path = 'www/css/components.css'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = """.print-only-selection { display: none; }
@media print {
  body.printing-selection .app-content { display: none !important; }
  body.printing-selection .print-only-selection {
    display: block !important;
    padding: 24px;
    background: #fff !important;
    color: #000 !important;
  }
  body.printing-selection .print-only-selection .verse-text,
  body.printing-selection .print-only-selection .ministry-theme-label {
    color: #000 !important;
  }
}"""

new = """.print-only-selection { display: none; }
@media print {
  body.printing-selection .phone-frame,
  body.printing-selection .selection-toolbar,
  body.printing-selection .tts-status {
    display: none !important;
  }
  body.printing-selection .print-only-selection {
    display: block !important;
    position: static !important;
    padding: 24px;
    background: #fff !important;
    color: #000 !important;
  }
  body.printing-selection .print-only-selection .verse-text,
  body.printing-selection .print-only-selection .ministry-theme-label {
    color: #000 !important;
  }
}"""

qtd = content.count(old)
if qtd != 1:
    raise SystemExit(f"ERRO: encontrado {qtd} vezes (esperado 1).")
content = content.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("components.css atualizado com sucesso")
