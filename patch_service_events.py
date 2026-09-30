path = 'android/app/src/main/java/com/biblia/deestudo/MediaNotificationService.java'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old1 = '    public static final String EVENT_BOOK_COMPLETE = "com.biblia.deestudo.NARRATION_BOOK_COMPLETE";\n'
new1 = old1 + '    public static final String EVENT_REQUEST_PREV_CHAPTER = "com.biblia.deestudo.NARRATION_REQUEST_PREV_CHAPTER";\n    public static final String EVENT_REQUEST_NEXT_CHAPTER = "com.biblia.deestudo.NARRATION_REQUEST_NEXT_CHAPTER";\n'
if content.count(old1) != 1:
    raise SystemExit("ERRO 1")
content = content.replace(old1, new1)

old2 = "notificarSemDado(EVENT_BOOK_COMPLETE_PREV());"
new2 = "notificarSemDado(EVENT_REQUEST_PREV_CHAPTER);"
if content.count(old2) != 1:
    raise SystemExit("ERRO 2")
content = content.replace(old2, new2)

old3 = "notificarSemDado(EVENT_BOOK_COMPLETE_NEXT());"
new3 = "notificarSemDado(EVENT_REQUEST_NEXT_CHAPTER);"
if content.count(old3) != 1:
    raise SystemExit("ERRO 3")
content = content.replace(old3, new3)

old4 = """    // Pequeno truque para reaproveitar os eventos de troca de capítulo já
    // existentes sem precisar de mais duas constantes públicas.
    private String EVENT_BOOK_COMPLETE_PREV() { return "com.biblia.deestudo.NARRATION_REQUEST_PREV_CHAPTER"; }
    private String EVENT_BOOK_COMPLETE_NEXT() { return "com.biblia.deestudo.NARRATION_REQUEST_NEXT_CHAPTER"; }

"""
if content.count(old4) != 1:
    raise SystemExit("ERRO 4")
content = content.replace(old4, "")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("MediaNotificationService.java limpo com sucesso")
