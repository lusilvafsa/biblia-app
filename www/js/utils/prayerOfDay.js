// Oração do dia: uma por dia, calculada só pela data, e respeitando o período
// (manhã, tarde ou noite). Usada pela tela inicial e pela tela de Oração, para as
// duas mostrarem sempre a mesma.
import { PRAYERS } from '../../data/prayers.js';

export function periodoDoDia(data = new Date()) {
  const h = data.getHours();
  if (h >= 5 && h < 12) return 'manha';
  if (h >= 12 && h < 18) return 'tarde';
  return 'noite';
}

export function oracoesDoPeriodo(data = new Date()) {
  const periodo = periodoDoDia(data);
  const lista = PRAYERS.filter((p) => !p.momento || p.momento === 'qualquer' || p.momento === periodo);
  return lista.length ? lista : PRAYERS;
}

export function oracaoDoDia(data = new Date()) {
  const lista = oracoesDoPeriodo(data);
  const dias = Math.floor(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()) / 86400000);
  return lista[((dias % lista.length) + lista.length) % lista.length];
}
