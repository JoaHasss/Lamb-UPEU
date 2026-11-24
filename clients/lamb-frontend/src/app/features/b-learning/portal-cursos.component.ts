import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CURSOS_MOCK,
  COMUNICADOS_MOCK,
  PENDIENTES_MOCK,
  PERIODOS_MOCK,
  SESIONES_HOY_MOCK,
} from './mocks/b-learning.mocks';

import { SinGuion } from '../../core/sin-guion.pipe';
@Component({
  selector: 'app-b-learning-portal',
  standalone: true,
  imports: [SinGuion, CommonModule, FormsModule],
  templateUrl: './portal-cursos.component.html',
  styleUrl: './portal-cursos.component.scss',
})
export class PortalCursosComponent {
  periodos = PERIODOS_MOCK;
  periodoSeleccionado = signal<string>('2026-2');

  cursos = computed(() =>
    CURSOS_MOCK.filter((c) => c.periodoId === this.periodoSeleccionado())
  );

  sesionesHoy = SESIONES_HOY_MOCK;
  pendientes = PENDIENTES_MOCK;
  comunicados = COMUNICADOS_MOCK;

  onPeriodoChange(id: string) {
    this.periodoSeleccionado.set(id);
  }

  irACurso(id: string) {
    // placeholder: aqui ira router.navigate(['/b-learning/curso', id])
    console.log('Ir a curso', id);
  }
}
