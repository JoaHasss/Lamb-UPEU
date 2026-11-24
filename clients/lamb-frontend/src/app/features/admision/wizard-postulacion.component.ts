import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';

import { SinGuion } from '../../core/sin-guion.pipe';
interface ReniecResponse {
  dni: string;
  nombres: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  nombreCompleto: string | null;
  encontrado: boolean;
  fuente: string;
}

interface WizardResponse {
  idPostulante: number;
  idPersona: number;
  codigoPostulante: string;
  nombreCompleto: string;
  estado: string;
  periodo: string;
  mensajeConfirmacion: string;
  correoProgramado: boolean;
  correoDestino: string | null;
}

@Component({
  selector: 'app-wizard-postulacion',
  standalone: true,
  imports: [SinGuion, CommonModule, FormsModule],
  templateUrl: './wizard-postulacion.component.html',
  styleUrl: './wizard-postulacion.component.scss'
})
export class WizardPostulacionComponent {
  private api = inject(ApiService);
  private router = inject(Router);

  paso = signal(1);
  loading = signal(false);
  error = signal<string | null>(null);

  // Paso 1 — DNI + RENIEC
  dni = signal('');
  reniec = signal<ReniecResponse | null>(null);

  // Paso 2 — Académico
  idConvocatoria = signal<number | null>(null);
  idExamen = signal<number | null>(null);
  idModalidad = signal<number | null>(null);
  convocatorias = signal<any[]>([]);
  modalidades = signal<any[]>([]);
  examenes = signal<any[]>([]);

  convocatoriaSearchText = signal('');
  convocatoriaSearchOpen = signal(false);
  convocatoriaSearchResults = computed(() => {
    const q = this.convocatoriaSearchText().trim().toLowerCase();
    const lista = this.convocatorias();
    if (!q) return lista;
    return lista.filter(c => c.nombre?.toLowerCase().includes(q) || String(c.id).includes(q));
  });

  modalidadSearchText = signal('');
  modalidadSearchOpen = signal(false);
  modalidadSearchResults = computed(() => {
    const q = this.modalidadSearchText().trim().toLowerCase();
    const lista = this.modalidades();
    if (!q) return lista;
    return lista.filter(m => m.nombre?.toLowerCase().includes(q) || String(m.id).includes(q));
  });

  examenSearchText = signal('');
  examenSearchOpen = signal(false);
  examenSearchResults = computed(() => {
    const q = this.examenSearchText().trim().toLowerCase();
    const lista = this.examenes();
    if (!q) return lista;
    return lista.filter(e => e.nombre?.toLowerCase().includes(q) || String(e.id).includes(q));
  });

  // Paso 3 — Contacto
  colegio = signal('');
  anioEgreso = signal<number | null>(null);
  promedio = signal<number | null>(null);
  telefono = signal('');
  correo = signal('');
  apoderado = signal('');
  telefonoApoderado = signal('');

  // Resultado
  resultado = signal<WizardResponse | null>(null);

  puedePaso2 = computed(() => !!this.reniec()?.encontrado);
  puedePaso3 = computed(() => !!this.idConvocatoria() && !!this.idExamen() && !!this.idModalidad());

  constructor() {
    this.cargarCatalogos();
  }

  cargarCatalogos() {
    this.api.list<any>('/api/v1/convocatorias').subscribe({
      next: r => this.convocatorias.set(r.filter((c: any) => c.estado === 'ABIERTA')),
      error: () => this.convocatorias.set([])
    });
    this.api.list<any>('/api/v1/modalidades-admision').subscribe({
      next: r => this.modalidades.set(r),
      error: () => this.modalidades.set([])
    });
    this.api.list<any>('/api/v1/examenes-admision').subscribe({
      next: r => this.examenes.set(r),
      error: () => this.examenes.set([])
    });
  }

  buscarDni() {
    const dni = this.dni().trim();
    if (!/^\d{8}$/.test(dni)) {
      this.error.set('El DNI debe tener 8 dígitos.');
      return;
    }
    this.error.set(null);
    this.loading.set(true);
    this.api.get<ReniecResponse>(`/api/v1/admision/reniec/${dni}`).subscribe({
      next: r => {
        this.loading.set(false);
        this.reniec.set(r);
        if (!r.encontrado) this.error.set(`No se encontraron datos (${r.fuente}).`);
      },
      error: e => {
        this.loading.set(false);
        this.error.set(`Error RENIEC: ${e.status ?? ''} ${e.message ?? ''}`);
      }
    });
  }

  onConvocatoriaSearchInput(valor: string) {
    this.convocatoriaSearchText.set(valor);
    this.convocatoriaSearchOpen.set(true);
    if (!valor.trim()) this.idConvocatoria.set(null);
  }

  openConvocatoriaSearch() {
    this.convocatoriaSearchOpen.set(true);
  }

  closeConvocatoriaSearch() {
    setTimeout(() => this.convocatoriaSearchOpen.set(false), 150);
  }

  selectConvocatoria(c: any) {
    this.idConvocatoria.set(c.id);
    this.convocatoriaSearchText.set(`${c.nombre} · ${c.periodo}`);
    this.convocatoriaSearchOpen.set(false);
  }

  onModalidadSearchInput(valor: string) {
    this.modalidadSearchText.set(valor);
    this.modalidadSearchOpen.set(true);
    if (!valor.trim()) this.idModalidad.set(null);
  }

  openModalidadSearch() {
    this.modalidadSearchOpen.set(true);
  }

  closeModalidadSearch() {
    setTimeout(() => this.modalidadSearchOpen.set(false), 150);
  }

  selectModalidad(m: any) {
    this.idModalidad.set(m.id);
    this.modalidadSearchText.set(m.nombre);
    this.modalidadSearchOpen.set(false);
  }

  onExamenSearchInput(valor: string) {
    this.examenSearchText.set(valor);
    this.examenSearchOpen.set(true);
    if (!valor.trim()) this.idExamen.set(null);
  }

  openExamenSearch() {
    this.examenSearchOpen.set(true);
  }

  closeExamenSearch() {
    setTimeout(() => this.examenSearchOpen.set(false), 150);
  }

  selectExamen(ex: any) {
    this.idExamen.set(ex.id);
    this.examenSearchText.set(ex.nombre);
    this.examenSearchOpen.set(false);
  }

  avanzar() {
    if (this.paso() === 1 && !this.puedePaso2()) return;
    if (this.paso() === 2 && !this.puedePaso3()) return;
    this.paso.update(p => Math.min(3, p + 1));
  }

  volver() {
    this.paso.update(p => Math.max(1, p - 1));
  }

  registrar() {
    const r = this.reniec();
    if (!r?.encontrado) return;
    const payload = {
      dni: r.dni,
      nombres: r.nombres,
      apellidoPaterno: r.apellidoPaterno,
      apellidoMaterno: r.apellidoMaterno,
      idConvocatoria: this.idConvocatoria(),
      idExamen: this.idExamen(),
      idModalidad: this.idModalidad(),
      colegioProcedencia: this.colegio() || null,
      anioEgresoColegio: this.anioEgreso(),
      promedioColegio: this.promedio(),
      telefonoContacto: this.telefono() || null,
      correoContacto: this.correo() || null,
      nombreApoderado: this.apoderado() || null,
      telefonoApoderado: this.telefonoApoderado() || null
    };
    this.loading.set(true);
    this.error.set(null);
    this.api.post<WizardResponse>('/api/v1/admision/postulacion-wizard', payload).subscribe({
      next: res => {
        this.loading.set(false);
        this.resultado.set(res);
        this.paso.set(4);
      },
      error: e => {
        this.loading.set(false);
        const msg = e.error?.message || e.error?.detail || e.message || 'Error al registrar';
        this.error.set(`${e.status ?? ''} ${msg}`);
      }
    });
  }

  nuevo() {
    this.paso.set(1);
    this.dni.set('');
    this.reniec.set(null);
    this.idConvocatoria.set(null);
    this.idExamen.set(null);
    this.idModalidad.set(null);
    this.convocatoriaSearchText.set('');
    this.convocatoriaSearchOpen.set(false);
    this.modalidadSearchText.set('');
    this.modalidadSearchOpen.set(false);
    this.examenSearchText.set('');
    this.examenSearchOpen.set(false);
    this.colegio.set('');
    this.anioEgreso.set(null);
    this.promedio.set(null);
    this.telefono.set('');
    this.correo.set('');
    this.apoderado.set('');
    this.telefonoApoderado.set('');
    this.resultado.set(null);
    this.error.set(null);
  }

  irAListado() {
    this.router.navigate(['/crud/postulantes']);
  }
}
