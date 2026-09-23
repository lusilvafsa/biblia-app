path = 'www/js/features/profile/profile.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = """      await progressRepository.syncWithCloud();

      console.log(
        '[Cloud Sync] Progresso de leitura sincronizado após login.'
      );

    } catch (error) {"""

new = """      await progressRepository.syncWithCloud();

      console.log(
        '[Cloud Sync] Progresso de leitura sincronizado após login.'
      );

      await highlightRepository.syncWithCloud();

      console.log(
        '[Cloud Sync] Grifos sincronizados após login.'
      );

      await planProgressRepository.syncWithCloud();

      console.log(
        '[Cloud Sync] Progresso dos planos de leitura sincronizado após login.'
      );

    } catch (error) {"""

qtd = content.count(old)
if qtd != 1:
    raise SystemExit(f"ERRO: encontrado {qtd} vezes (esperado 1).")
content = content.replace(old, new)

old_import = "import { progressRepository } from '../../data-access/progressRepository.js';"
new_import = old_import + "\nimport { highlightRepository } from '../../data-access/highlightRepository.js';\nimport { planProgressRepository } from '../../data-access/planProgressRepository.js';"
qtd2 = content.count(old_import)
if qtd2 != 1:
    raise SystemExit(f"ERRO 2: import do progressRepository encontrado {qtd2} vezes.")
content = content.replace(old_import, new_import)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("profile.js atualizado com sucesso")
