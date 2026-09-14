import { describe, it, expect } from 'vitest';
import { recursoVigente } from './governance.model';

describe('recursoVigente', () => {
  it('es vigente si la fecha de expiración es igual a hoy', () => {
    expect(recursoVigente({ tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2026-08-06' }, '2026-08-06')).toBe(true);
  });

  it('es vigente si la fecha de expiración es futura', () => {
    expect(recursoVigente({ tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2026-09-01' }, '2026-08-06')).toBe(true);
  });

  it('no es vigente si la fecha de expiración ya pasó', () => {
    expect(recursoVigente({ tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2026-07-01' }, '2026-08-06')).toBe(false);
  });
});
