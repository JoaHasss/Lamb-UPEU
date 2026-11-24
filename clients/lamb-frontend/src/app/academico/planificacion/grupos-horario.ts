import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, forkJoin, catchError, of } from 'rxjs';
import { Campo } from '../../features/microservicios/ms.model';
import { AcademicoApi, Fila, etiquetaFila, insigniaEstado, textoCelda } from '../academico-api';
import { GrupoDetalle } from './grupo-detalle';
import { FormularioModal, textoError } from '../comun/formulario-modal';
import { SesionUi } from '../comun/sesion-ui';
import { MODULOS } from '../modulos';
import { BloqueFranja, SelectorFranjas } from '../comun/selector-franjas';

import { SinGuion } from '../../core/sin-guion.pipe';
interface Horario {
  id?: number;
  idAmbiente: number | null;
  codigoAmbiente?: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  activo?: boolean;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  tipoHorario?: string;
  codigoTipo?: string;
  etiquetaTipo?: string;
  rolDocente?: string | null;
  idDocente?: number | null;
  nombreModulo?: string | null;
}

interface Docente {
  idDocente: number;
  rol: string;
  horasSemanales: number;
  gestionaNota?: boolean;
  gestionaAsistencia?: boolean;
}

interface Grupo {
  id: number;
  codigo: string;
  idOferta: number;
  idPrograma: number | null;
  periodo: string;
  cupoMaximo: number;
  ciclo?: number | null;
  estado: string;
  motivo: string | null;
  version: number;
  horarioResumen?: string;
  curso: { id: number; codigo: string; nombre: string; creditos: number; horasTeoria?: number; horasPractica?: number } | null;
  horarios: Horario[];
  docentes: Docente[];
}

interface Paleta {
  color: string;
  light: string;
  border: string;
}

// Colores de los cursos del diseño (MisCursos)
const PALETAS: Paleta[] = [
  { color: '#FBBF24', light: '#FEF3C7', border: '#F59E0B' },
  { color: '#60A5FA', light: '#DBEAFE', border: '#3B82F6' },
  { color: '#F472B6', light: '#FCE7F3', border: '#EC4899' },
  { color: '#34D399', light: '#D1FAE5', border: '#10B981' },
  { color: '#A78BFA', light: '#EDE9FE', border: '#7C3AED' },
  { color: '#FB923C', light: '#FFEDD5', border: '#EA580C' },
];

export const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
const DIAS_CORTO: Record<string, string> = {
  LUNES: 'Lun',
  MARTES: 'Mar',
  MIERCOLES: 'Mié',
  JUEVES: 'Jue',
  VIERNES: 'Vie',
  SABADO: 'Sáb',
  DOMINGO: 'Dom',
};
const DIAS_LARGO: Record<string, string> = {
  LUNES: 'LUNES',
  MARTES: 'MARTES',
  MIERCOLES: 'MIÉRCOLES',
  JUEVES: 'JUEVES',
  VIERNES: 'VIERNES',
  SABADO: 'SÁBADO',
  DOMINGO: 'DOMINGO',
};
const INICIO = 7;
const FIN = 22;
const ALTO = 56;
const RUTA = '/api/v1/grupos';

interface Bloque {
  grupo: Grupo;
  h: Horario;
  top: number;
  alto: number;
  paleta: Paleta;
}

/** Grupos del periodo y su horario semanal (MisCursos del diseño) + apertura transaccional. */
@Component({
  selector: 'ac-grupos-horario',
  imports: [SinGuion, FormsModule, FormularioModal, GrupoDetalle, SelectorFranjas],
  templateUrl: './grupos-horario.html',
})
export class GruposHorario {
  readonly api = inject(AcademicoApi);
  private readonly sesion = inject(SesionUi);

  readonly grupos = signal<Grupo[]>([]);
  readonly ofertas = signal<Fila[]>([]);
  readonly ambientes = signal<Fila[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly aviso = signal<string | null>(null);
  readonly seleccion = signal<number | null>(null);
  readonly vista = signal<'Semana' | 'Lista'>('Semana');
  readonly filtroAmbiente = signal<string>('');
  readonly soloPeriodo = signal(true);
  // Ciclo de la cohorte: '' = todos. Filtra la lista de grupos y el horario semanal
  readonly filtroCiclo = signal<string>('');
  // Grupo (seccion) por codigo: con un ciclo elegido, el horario queda como lo ve esa seccion
  readonly filtroGrupo = signal<string>('');
  readonly detalle = signal<Fila | null>(null);
  readonly edicion = signal<{ campos: Campo[]; inicial: Fila; accion: (c: Fila) => Observable<unknown>; titulo: string } | null>(null);
  readonly porEliminar = signal<number | null>(null);
  readonly nombresPrograma = signal<Map<string, string>>(new Map());

  // Formulario de apertura (cabecera + horarios + docentes en una sola transaccion)
  readonly creando = signal(false);
  readonly guardando = signal(false);
  readonly errorForm = signal<string | null>(null);
  nuevo = this.grupoVacio();

  readonly puedeEscribir = computed(() => this.sesion.puedeEscribir(MODULOS[1].rolesEscritura));
  readonly dias = DIAS.slice(0, 6);
  readonly diasTodos = DIAS;
  readonly roles = ['TITULAR', 'PRACTICA', 'APOYO'];
  readonly horas = Array.from({ length: FIN - INICIO }, (_, i) => INICIO + i);
  readonly alto = ALTO;
  readonly hoy = DIAS[(new Date().getDay() + 6) % 7];
  readonly modulos = signal<Fila[]>([]);
  readonly lunes = signal<Date>(lunesDe(new Date()));
  readonly fechasSemana = computed(() => DIAS.map((_, i) => iso(sumarDias(this.lunes(), i))));
  readonly rangoSemana = computed(() => {
    const f = this.fechasSemana();
    return `${f[0].split('-').reverse().join('/')} – ${f[6].split('-').reverse().join('/')}`;
  });

  readonly visibles = computed(() => {
    const p = this.api.periodo();
    const prog = this.api.programa();
    const ciclo = this.filtroCiclo();
    const grupo = this.filtroGrupo();
    return this.grupos().filter(
      (g) =>
        (!this.soloPeriodo() || !p || g.periodo === p) &&
        (!prog || String(g.idPrograma) === prog) &&
        (!ciclo || String(g.ciclo) === ciclo) &&
        (!grupo || g.codigo === grupo),
    );
  });

  /** Codigos de grupo del periodo, programa y ciclo elegidos (para el filtro). */
  readonly gruposDisponibles = computed(() => {
    const p = this.api.periodo();
    const prog = this.api.programa();
    const ciclo = this.filtroCiclo();
    const set = new Set<string>();
    this.grupos()
      .filter((g) => (!this.soloPeriodo() || !p || g.periodo === p) && (!prog || String(g.idPrograma) === prog) && (!ciclo || String(g.ciclo) === ciclo))
      .forEach((g) => set.add(g.codigo));
    return [...set].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
  });

  elegirCiclo(valor: string): void {
    this.filtroCiclo.set(valor);
    // El grupo elegido puede no existir en el ciclo nuevo
    if (this.filtroGrupo() && !this.gruposDisponibles().includes(this.filtroGrupo())) {
      this.filtroGrupo.set('');
    }
  }

  /** Ciclos con grupos en el periodo y programa elegidos (para el filtro). */
  readonly ciclosDisponibles = computed(() => {
    const p = this.api.periodo();
    const prog = this.api.programa();
    const set = new Set<number>();
    this.grupos()
      .filter((g) => (!this.soloPeriodo() || !p || g.periodo === p) && (!prog || String(g.idPrograma) === prog) && g.ciclo)
      .forEach((g) => set.add(Number(g.ciclo)));
    return [...set].sort((a, b) => a - b);
  });

  romano(n: number | null | undefined): string {
    return n ? (['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV'][n - 1] ?? String(n)) : '—';
  }

  private readonly paletaPorCurso = computed(() => {
    const mapa = new Map<string, Paleta>();
    for (const g of this.grupos()) {
      const k = g.curso?.codigo ?? g.codigo;
      if (!mapa.has(k)) {
        mapa.set(k, PALETAS[mapa.size % PALETAS.length]);
      }
    }
    return mapa;
  });

  readonly bloques = computed(() => {
    const porDia: Record<string, Bloque[]> = {};
    const amb = this.filtroAmbiente();
    for (const g of this.visibles()) {
      if (g.estado === 'ANULADO') {
        continue;
      }
      for (const h of g.horarios) {
        if (h.activo === false || (amb && String(h.idAmbiente) !== amb)) {
          continue;
        }
        const semana = this.fechasSemana();
        if ((h.fechaInicio && h.fechaInicio > semana[6]) || (h.fechaFin && h.fechaFin < semana[0])) {
          continue;
        }
        const ini = horas(h.horaInicio);
        const fin = horas(h.horaFin);
        (porDia[h.diaSemana] ??= []).push({
          grupo: g,
          h,
          top: (ini - INICIO) * ALTO,
          alto: Math.max((fin - ini) * ALTO, 24),
          paleta: this.paleta(g),
        });
      }
    }
    return porDia;
  });

  readonly totalBloques = computed(() => Object.values(this.bloques()).reduce((s, b) => s + b.length, 0));

  constructor() {
    this.cargar();
    this.api.nombresPrograma().subscribe((m) => this.nombresPrograma.set(m));
  }

  /** Carrera del grupo (sale de su oferta); el nombre viene de institucional. */
  programa(idPrograma: number | null | undefined): string {
    if (idPrograma === null || idPrograma === undefined) {
      return 'Sin programa asignado';
    }
    return this.nombresPrograma().get(String(idPrograma)) ?? `Programa #${idPrograma}`;
  }

  private sondeos = 0;

  cargar(): void {
    this.cargando.set(this.grupos().length === 0);
    forkJoin({
      grupos: this.api.get<Grupo[]>('planificacion', RUTA),
      ofertas: this.api.listar('planificacion', '/api/v1/ofertas-academicas').pipe(catchError(() => of([]))),
      ambientes: this.api.listar('planificacion', '/api/v1/ambientes').pipe(catchError(() => of([]))),
      modulos: this.api.listar('planificacion', '/api/v1/modulos-periodo').pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ grupos, ofertas, ambientes, modulos }) => {
        this.modulos.set(modulos);
        this.grupos.set([...grupos].sort((a, b) => (a.curso?.codigo ?? '').localeCompare(b.curso?.codigo ?? '') || a.codigo.localeCompare(b.codigo)));
        this.ofertas.set(ofertas);
        this.ambientes.set(ambientes);
        this.cargando.set(false);
        // El paso PENDIENTE_ACTA -> ABIERTO/ANULADO llega por Kafka: se vuelve a consultar cada 3 s (max. 10 veces)
        if (grupos.some((g) => g.estado === 'PENDIENTE_ACTA') && this.sondeos < 10) {
          this.sondeos++;
          setTimeout(() => this.cargar(), 3000);
        } else {
          this.sondeos = 0;
        }
      },
      error: (e) => {
        this.cargando.set(false);
        this.error.set(textoError(e));
      },
    });
  }

  paleta(g: Grupo): Paleta {
    return this.paletaPorCurso().get(g.curso?.codigo ?? g.codigo) ?? PALETAS[0];
  }

  moverSemana(delta: number): void {
    this.lunes.set(delta === 0 ? lunesDe(new Date()) : sumarDias(this.lunes(), delta * 7));
  }

  resumenHorario(g: Grupo): string {
    if (g.horarioResumen) {
      return g.horarioResumen;
    }
    const activos = g.horarios.filter((h) => h.activo !== false);
    return activos.length
      ? activos.map((h) => `${DIAS_CORTO[h.diaSemana] ?? h.diaSemana} ${h.horaInicio.slice(0, 5)}–${h.horaFin.slice(0, 5)}`).join(' · ')
      : 'Sin horario';
  }

  titular(g: Grupo): string {
    const t = g.docentes.find((d) => d.rol === 'TITULAR') ?? g.docentes[0];
    return t ? `Docente ${t.rol.toLowerCase()}: #${t.idDocente}` : 'Sin docente asignado';
  }

  diaLargo(d: string): string {
    return DIAS_LARGO[d] ?? d;
  }

  insignia(estado: string) {
    return insigniaEstado(estado);
  }

  texto(v: unknown): string {
    return textoCelda(v);
  }

  alternar(g: Grupo): void {
    this.seleccion.set(this.seleccion() === g.id ? null : g.id);
  }

  ver(g: Grupo): void {
    this.detalle.set(g as unknown as Fila);
  }

  // ─── Apertura transaccional ───────────────────────────────────────────────
  private grupoVacio() {
    return {
      idOferta: '' as unknown,
      codigo: '',
      cupoMaximo: 40 as unknown,
      horarios: [bloqueVacio('TEORIA')],
      docentes: [{ idDocente: '' as unknown, rol: 'TITULAR', horasSemanales: 4 as unknown, gestionaNota: true, gestionaAsistencia: true }],
    };
  }

  ofertasDelPeriodo(): Fila[] {
    const p = this.api.periodo();
    const prog = this.api.programa();
    const filtradas = this.ofertas().filter((o) => (!p || o['codigoPeriodo'] === p) && (!prog || String(o['idPrograma']) === prog));
    return filtradas.length ? filtradas : this.ofertas();
  }

  etiquetaOferta(o: Fila): string {
    return `${o['codigoCurso'] ?? 'Curso #' + o['idCurso']} · ciclo ${o['ciclo'] ?? '—'} · ${this.programa(o['idPrograma'] as number | null)} · ${o['codigoPeriodo'] ?? ''} (${o['estado']})`;
  }

  etiquetaAmbiente(a: Fila): string {
    return `${a['codigo']} · ${a['nombre'] ?? ''} (aforo ${a['aforo'] ?? '—'})`;
  }

  abrirNuevo(): void {
    this.nuevo = this.grupoVacio();
    this.errorForm.set(null);
    this.creando.set(true);
  }

  readonly verFranjas = signal(false);

  /** Bloques armados con franjas pedagogicas: reemplazan el bloque inicial si no se toco. */
  agregarFranjas(bloques: BloqueFranja[]): void {
    const inicial = JSON.stringify(bloqueVacio('TEORIA'));
    const sinTocar = this.nuevo.horarios.length === 1 && JSON.stringify(this.nuevo.horarios[0]) === inicial;
    const nuevos = bloques.map((b) => ({ ...bloqueVacio('TEORIA'), ...b }));
    this.nuevo.horarios = sinTocar ? nuevos : [...this.nuevo.horarios, ...nuevos];
    this.verFranjas.set(false);
  }

  agregarHorario(): void {
    this.nuevo.horarios.push(bloqueVacio('PRACTICA'));
  }

  agregarDocente(): void {
    this.nuevo.docentes.push({ idDocente: '', rol: 'PRACTICA', horasSemanales: 2, gestionaNota: false, gestionaAsistencia: true });
  }

  // Como el LAMB: el jefe de practica toma asistencia pero no pone notas
  cambioRol(d: { rol: string; gestionaNota: boolean }): void {
    d.gestionaNota = d.rol !== 'PRACTICA';
  }

  /** Modulos del periodo de la oferta elegida. */
  modulosDeOferta(): Fila[] {
    const oferta = this.ofertas().find((o) => String(o['id']) === String(this.nuevo.idOferta));
    return this.modulos().filter((m) => !oferta || m['idPeriodo'] === oferta['idPeriodo']);
  }

  /** Docentes escritos en el formulario, para elegir quien dicta cada bloque. */
  docentesDelPedido(): string[] {
    return this.nuevo.docentes.map((d) => String(d.idDocente ?? '')).filter((x) => x !== '');
  }

  guardarNuevo(): void {
    this.errorForm.set(null);
    const n = this.nuevo;
    if (!n.idOferta || !n.codigo.trim() || !n.cupoMaximo) {
      this.errorForm.set('Completa oferta, código y cupo máximo.');
      return;
    }
    if (n.horarios.some((h) => !h.horaInicio || !h.horaFin)) {
      this.errorForm.set('Cada bloque necesita hora de inicio y hora de fin (el ambiente puede quedar por confirmar).');
      return;
    }
    if (n.horarios.some((h) => h.horaFin <= h.horaInicio)) {
      this.errorForm.set('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }
    const cuerpo = {
      idOferta: Number(n.idOferta),
      codigo: n.codigo.trim(),
      cupoMaximo: Number(n.cupoMaximo),
      horarios: n.horarios.map((h) => ({
        idAmbiente: h.idAmbiente ? Number(h.idAmbiente) : null,
        diaSemana: h.diaSemana,
        horaInicio: conSegundos(h.horaInicio),
        horaFin: conSegundos(h.horaFin),
        tipoHorario: h.tipoHorario,
        numeroSubgrupo: h.numeroSubgrupo ? Number(h.numeroSubgrupo) : null,
        idDocente: h.idDocente ? Number(h.idDocente) : null,
        idModulo: h.idModulo ? Number(h.idModulo) : null,
      })),
      docentes: n.docentes
        .filter((d) => d.idDocente !== '' && d.idDocente !== null)
        .map((d) => ({
          idDocente: Number(d.idDocente),
          rol: d.rol,
          horasSemanales: Number(d.horasSemanales) || 0,
          gestionaNota: d.gestionaNota,
          gestionaAsistencia: d.gestionaAsistencia,
        })),
    };
    this.guardando.set(true);
    this.api.post<Grupo>('planificacion', RUTA, cuerpo).subscribe({
      next: (g) => {
        this.guardando.set(false);
        this.creando.set(false);
        this.seleccion.set(g.id);
        this.listo(`Grupo ${g.codigo} registrado (${g.estado.replaceAll('_', ' ')}): cabecera, horario y docentes en una sola transacción.`);
      },
      error: (e) => {
        this.guardando.set(false);
        this.errorForm.set(textoError(e));
      },
    });
  }

  // ─── Otras acciones ──────────────────────────────────────────────────────
  editar(g: Grupo): void {
    const op = this.api.recurso('planificacion', RUTA)?.actualizar;
    if (!op) {
      return;
    }
    this.edicion.set({
      titulo: `Editar grupo ${g.codigo}`,
      campos: op.campos.filter((c) => c.nombre !== 'version'),
      inicial: g as unknown as Fila,
      // version viaja oculta: el @Version del backend detecta ediciones simultaneas (409)
      accion: (c) => this.api.put('planificacion', `${RUTA}/${g.id}`, { ...c, version: g.version }),
    });
  }

  revalidar(g: Grupo): void {
    this.api.post('planificacion', `${RUTA}/${g.id}/revalidar`).subscribe({
      next: () => this.listo(`Grupo ${g.codigo} revalidado.`),
      error: (e) => this.error.set(textoError(e)),
    });
  }

  eliminar(g: Grupo): void {
    this.porEliminar.set(null);
    this.api.delete('planificacion', `${RUTA}/${g.id}`).subscribe({
      next: () => {
        this.seleccion.set(null);
        this.listo(`Grupo ${g.codigo} eliminado.`);
      },
      error: (e) => this.error.set(textoError(e)),
    });
  }

  edicionGuardada(): void {
    this.edicion.set(null);
    this.listo('Grupo actualizado.');
  }

  private listo(texto: string): void {
    this.api.invalidar('planificacion', RUTA);
    this.aviso.set(texto);
    setTimeout(() => this.aviso.set(null), 4500);
    this.cargar();
  }

  etiqueta(f: Fila): string {
    return etiquetaFila(f);
  }
}

function bloqueVacio(tipoHorario: string) {
  return {
    idAmbiente: '' as unknown,
    diaSemana: 'LUNES',
    horaInicio: tipoHorario === 'TEORIA' ? '08:00' : '10:00',
    horaFin: tipoHorario === 'TEORIA' ? '10:00' : '12:00',
    tipoHorario,
    numeroSubgrupo: (tipoHorario === 'PRACTICA' ? 1 : '') as unknown,
    idDocente: '' as unknown,
    idModulo: '' as unknown,
  };
}

function lunesDe(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7));
  return r;
}

function sumarDias(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function horas(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h + (m || 0) / 60;
}

function conSegundos(hhmm: string): string {
  return hhmm.length === 5 ? `${hhmm}:00` : hhmm;
}
