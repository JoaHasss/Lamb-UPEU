import { Pipe, PipeTransform } from '@angular/core';

/**
 * Los booleanos del backend se muestran como "Sí" / "No" en vez de true / false.
 */
@Pipe({ name: 'siNo' })
export class SiNo implements PipeTransform {
  transform(valor: unknown): string {
    if (valor === null || valor === undefined) {
      return '—';
    }
    return valor === true || valor === 'true' ? 'Sí' : 'No';
  }
}
