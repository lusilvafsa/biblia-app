// Tela: Diário de Estudo — lista de temas, novo tema, importar e exportar.
import { diaryRepository } from '../../data-access/diaryRepository.js';
import { exportarJson, escolherJson } from './diaryFiles.js';
import { navigateTo } from '../../router.js';
import { setHeaderTitle } from '../../state/header.js';
import { toast } from '../../utils/toast.js';

function esc(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export const diaryListPage = {
  render(container) {
    setHeaderTitle('Diário de Estudo');

    function desenhar() {
      const temas = diaryRepository.listar();
      const cartoes = temas.map((t) => {
        const n = t.passagens.length;
        return '<button type="button" class="diary-card" data-id="' + esc(t.id) + '">' +
          '<div class="diary-card-title">' + esc(t.nome) + '</div>' +
          (t.descricao ? '<div class="diary-card-desc">' + esc(t.descricao) + '</div>' : '') +
          '<div class="diary-card-meta">' + n + ' passagem' + (n === 1 ? '' : 's') + '</div></button>';
      }).join('');
      container.innerHTML = `
        <div class="diary-actions">
          <button type="button" class="diary-btn diary-btn--primary" id="diaryNovo">+ Novo tema</button>
          <button type="button" class="diary-btn" id="diaryImportar">Importar</button>
          <button type="button" class="diary-btn" id="diaryExportar">Exportar tudo</button>
        </div>
        <form class="diary-form" id="diaryForm" hidden>
          <input class="diary-input" id="diaryNome" maxlength="80" placeholder="Nome do tema (ex.: Fé, Perdão, Oração)" autocomplete="off">
          <textarea class="diary-input" id="diaryDescricao" rows="3" maxlength="500" placeholder="Descrição (opcional)"></textarea>
          <div class="diary-actions">
            <button type="submit" class="diary-btn diary-btn--primary">Criar tema</button>
            <button type="button" class="diary-btn" id="diaryCancelar">Cancelar</button>
          </div>
        </form>
        <div class="diary-list">${cartoes || '<div class="diary-empty">Nenhum tema ainda. Toque em "+ Novo tema" para começar, por exemplo "Fé", "Perdão" ou "Oração".</div>'}</div>
      `;

      const form = container.querySelector('#diaryForm');
      container.querySelector('#diaryNovo').addEventListener('click', () => {
        form.hidden = false;
        container.querySelector('#diaryNome').focus();
      });
      container.querySelector('#diaryCancelar').addEventListener('click', () => {
        form.hidden = true;
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const tema = diaryRepository.criar({
          nome: container.querySelector('#diaryNome').value,
          descricao: container.querySelector('#diaryDescricao').value,
        });
        if (!tema) {
          toast.info('Digite o nome do tema.');
          return;
        }
        toast.success('Tema criado!');
        navigateTo('/diario/' + tema.id);
      });
      container.querySelectorAll('.diary-card').forEach((c) => {
        c.addEventListener('click', () => navigateTo('/diario/' + c.dataset.id));
      });
      container.querySelector('#diaryExportar').addEventListener('click', async () => {
        if (!temas.length) {
          toast.info('Não há temas para exportar.');
          return;
        }
        const r = await exportarJson('diario-de-estudo.json', diaryRepository.exportar(), 'Diário de Estudo');
        if (r === 'erro') toast.error('Não foi possível exportar agora.');
      });
      container.querySelector('#diaryImportar').addEventListener('click', async () => {
        const dados = await escolherJson();
        if (dados === null) return;
        const r = dados === 'invalido' ? null : diaryRepository.importar(dados);
        if (!r) {
          toast.error('Arquivo inválido. Escolha um .json exportado pelo Diário.');
          return;
        }
        toast.success(r.novos + ' tema(s) novo(s), ' + r.mesclados + ' atualizado(s), ' + r.passagens + ' passagem(ns).');
        desenhar();
      });
    }

    desenhar();
  },
};
