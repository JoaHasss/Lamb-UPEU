import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/auth/auth-service';
import { CRUDS, CRUD_BY_SLUG } from '../features/cruds.catalog';

type ModuleKey = 'Admisión' | 'Trayectoria' | 'Institucional' | 'Personas' | 'Currículo' | 'Planificación' | 'Evaluación' | 'Matrícula' | 'Finanzas' | 'Ingresos y Pagos' | 'B-Learning';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  initials = computed(() => {
    const nombre = this.auth.nombreUsuario();
    if (!nombre) return 'NL';
    const limpio = nombre.replace(/[._]/g, ' ').trim();
    const partes = limpio.split(/\s+/).filter(Boolean);
    if (partes.length === 0) return 'NL';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  });

  collapsed = signal(false);
  private url = signal(this.router.url);

  // Módulo activo según la URL
  activeModule = computed<ModuleKey | null>(() => {
    const u = this.url();
    if (u.startsWith('/trayectoria') || u.startsWith('/mi-trayectoria')) return 'Trayectoria';
    if (u.startsWith('/admision') || u.startsWith('/postulaciones')) return 'Admisión';
    if (u.startsWith('/b-learning')) return 'B-Learning';
    // Currículo
    if (u.startsWith('/planes-estudio') || u.startsWith('/cursos')) return 'Currículo';
    // Planificación
    if (u.startsWith('/grupos') || u.startsWith('/secciones')) return 'Planificación';
    // Evaluación
    if (u.startsWith('/notas') || u.startsWith('/actas')) return 'Evaluación';
    // Matrícula
    if (u.startsWith('/matriculas') || u.startsWith('/enrolar')
        || u.startsWith('/periodos-academicos') || u.startsWith('/tipos-periodo')
        || u.startsWith('/historial-estados-matricula') || u.startsWith('/anulaciones-matricula')
        || u.startsWith('/observaciones-matricula') || u.startsWith('/notificaciones-matricula')
        || u.startsWith('/constancias-matricula') || u.startsWith('/tipos-matricula')
        || u.startsWith('/modalidades-matricula') || u.startsWith('/cronogramas-matricula')
        || u.startsWith('/matriculas-condicionales') || u.startsWith('/variaciones-matricula')
        || u.startsWith('/ampliaciones-plazo-matricula') || u.startsWith('/requisitos-por-tipo-matricula')
        || u.startsWith('/bloqueos-matricula') || u.startsWith('/compromisos-matricula')
        || u.startsWith('/reservas-vacante') || u.startsWith('/listas-espera-seccion')
        || u.startsWith('/ampliaciones-cupo') || u.startsWith('/condiciones-matricula')
        || u.startsWith('/situaciones-academicas-estudiante') || u.startsWith('/cambios-situacion-academica')
        || u.startsWith('/estudiantes-observados-suspendidos') || u.startsWith('/movilidades-estudiantiles')
        || u.startsWith('/intentos-curso') || u.startsWith('/cargas-academicas-periodo')
        || u.startsWith('/elecciones-curso-electivo') || u.startsWith('/cruces-horario-autorizados')
        || u.startsWith('/liberaciones-excepcionales-prerrequisito') || u.startsWith('/sobrecargas-creditos-autorizadas')
        || u.startsWith('/cargas-minimas-autorizadas') || u.startsWith('/solicitudes-rectificacion')
        || u.startsWith('/retiros-oficio') || u.startsWith('/retiros-inasistencia')
        || u.startsWith('/reactivaciones-matricula-anulada') || u.startsWith('/anulaciones-masivas-impago')
        || u.startsWith('/rehabilitaciones-matricula')) return 'Matrícula';
    // Finanzas (y los MS de ingresos-pagos / pagos)
    if (u.startsWith('/pagos') || u.startsWith('/estado-cuenta') || u.startsWith('/realizar-pago')
        || u.startsWith('/vouchers') || u.startsWith('/recaudaciones-ventanilla') || u.startsWith('/cuentas')
        || u.startsWith('/movimientos') || u.startsWith('/saldos-periodo') || u.startsWith('/ajustes-manuales')
        || u.startsWith('/reservas-devolucion') || u.startsWith('/categorias-concepto') || u.startsWith('/conceptos-pago')
        || u.startsWith('/tarifarios-escuela-ciclo') || u.startsWith('/cronogramas-vencimiento')
        || u.startsWith('/plantillas-plan-pago') || u.startsWith('/tipos-descuento') || u.startsWith('/descuentos-aplicados')
        || u.startsWith('/convenios-institucionales-descuento') || u.startsWith('/exoneraciones-pago')
        || u.startsWith('/tipos-beca') || u.startsWith('/becas-aplicadas') || u.startsWith('/renovaciones-suspensiones-beca')
        || u.startsWith('/estados-cobro') || u.startsWith('/detalles-cobro') || u.startsWith('/historiales-estado-cobro')
        || u.startsWith('/montos-pago') || u.startsWith('/documentos-pago') || u.startsWith('/series-correlativos-comprobante')
        || u.startsWith('/datos-facturacion-cliente') || u.startsWith('/anulaciones-comprobante')
        || u.startsWith('/notas-credito') || u.startsWith('/notas-debito') || u.startsWith('/solicitudes-devolucion')
        || u.startsWith('/reembolsos-pago') || u.startsWith('/cancelaciones-cargo-matricula')
        || u.startsWith('/transferencias-pago') || u.startsWith('/reclamos-pago')
        || u.startsWith('/estados-cuenta-estudiante') || u.startsWith('/constancias-no-adeudo')) return 'Finanzas';
    // Institucional (gestión académica — facultades y programas son parte de institucional)
    if (u.startsWith('/facultades') || u.startsWith('/programas')) return 'Institucional';
    // Personas (gestión académica)
    if (u.startsWith('/personas')) return 'Personas';
    // CRUD genérico
    const match = u.match(/^\/crud\/([^/?#]+)/);
    if (match) {
      const def = CRUD_BY_SLUG.get(match[1]);
      // Los CRUD del grupo 'Finanzas' (slugs fin-*) son de ingresos-pagos-ms: modulo propio.
      if (def) return def.group === 'Finanzas' ? 'Ingresos y Pagos' : (def.group as ModuleKey);
    }
    return null;
  });

  admision      = computed(() => CRUDS.filter(c => c.group === 'Admisión' && !c.hidden));
  trayectoria   = computed(() => CRUDS.filter(c => c.group === 'Trayectoria' && !c.hidden));
  institucional = computed(() => CRUDS.filter(c => c.group === 'Institucional' && !c.hidden));
  personas      = computed(() => CRUDS.filter(c => c.group === 'Personas' && !c.hidden));
  curriculo     = computed(() => CRUDS.filter(c => c.group === 'Currículo' && !c.hidden));
  finanzas      = computed(() => CRUDS.filter(c => c.group === 'Finanzas' && !c.hidden));
  planificacion = computed(() => CRUDS.filter(c => c.group === 'Planificación' && !c.hidden));

  showAdmision      = computed(() => this.activeModule() === 'Admisión');
  showTrayectoria   = computed(() => this.activeModule() === 'Trayectoria');
  showInstitucional = computed(() => this.activeModule() === 'Institucional');
  showPersonas      = computed(() => this.activeModule() === 'Personas');
  showCurriculo     = computed(() => this.activeModule() === 'Currículo');
  showPlanificacion = computed(() => this.activeModule() === 'Planificación');
  showEvaluacion    = computed(() => this.activeModule() === 'Evaluación');
  showMatricula     = computed(() => this.activeModule() === 'Matrícula');
  showFinanzas      = computed(() => this.activeModule() === 'Finanzas');
  showIngresos      = computed(() => this.activeModule() === 'Ingresos y Pagos');
  showBLearning     = computed(() => this.activeModule() === 'B-Learning');

  // Titulo del topbar segun el modulo activo
  moduleTitle = computed(() => {
    const m = this.activeModule();
    switch (m) {
      case 'Admisión':      return 'Portal UPeU · Admisión';
      case 'Trayectoria':   return 'Portal UPeU · Trayectoria';
      case 'Currículo':     return 'Portal UPeU · Currículo';
      case 'Planificación': return 'Portal UPeU · Planificación Académica';
      case 'Evaluación':    return 'Portal UPeU · Evaluación';
      case 'Matrícula':     return 'Portal UPeU · Matrícula';
      case 'Finanzas':      return 'Portal UPeU · Finanzas';
      case 'Ingresos y Pagos': return 'Portal UPeU · Ingresos y Pagos';
      case 'Institucional': return 'Portal UPeU · Institucional';
      case 'Personas':      return 'Portal UPeU · Personas';
      case 'B-Learning':    return 'Portal UPeU · B-Learning';
      default:              return 'Portal UPeU';
    }
  });

  // Grupos grandes (Institucional/Personas) se dividen en subgrupos colapsables
  // para no mostrar 40+ links sueltos en el sidebar.
  private agrupar(items: ReturnType<typeof computed<any[]>>) {
    return computed(() => {
      const out: { subgroup: string; items: any[] }[] = [];
      for (const item of (items as any)()) {
        const key = item.subgroup ?? 'Otros';
        let bucket = out.find(b => b.subgroup === key);
        if (!bucket) { bucket = { subgroup: key, items: [] }; out.push(bucket); }
        bucket.items.push(item);
      }
      return out;
    });
  }

  institucionalGrouped = this.agrupar(this.institucional);
  personasGrouped      = this.agrupar(this.personas);
  curriculoGrouped     = this.agrupar(this.curriculo);
  finanzasGrouped      = this.agrupar(this.finanzas);

  // undefined = sin override, usa el default (abierto si contiene el item activo)
  private subgroupOverrides = signal(new Map<string, boolean>());

  activeSlug = computed(() => {
    const match = this.url().match(/^\/crud\/([^/?#]+)/);
    return match ? match[1] : null;
  });

  isSubgroupOpen(subgroup: string, items: any[]): boolean {
    const override = this.subgroupOverrides().get(subgroup);
    if (override !== undefined) return override;
    return items.some(i => i.slug === this.activeSlug());
  }

  toggleSubgroup(subgroup: string, items: any[]) {
    const actual = this.isSubgroupOpen(subgroup, items);
    this.subgroupOverrides.update(map => {
      const next = new Map(map);
      next.set(subgroup, !actual);
      return next;
    });
  }

  constructor() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.url.set(e.urlAfterRedirects));
  }

  toggle() { this.collapsed.update(v => !v); }
  logout() { this.auth.cerrarSesion(); }
}
