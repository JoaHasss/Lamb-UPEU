import { Routes } from '@angular/router';

/** Portal academico (Modulo 02): curriculo, planificacion y evaluacion con el diseño de Figma. */
export const ACADEMICO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./portal/portal').then((m) => m.Portal),
  },
  // Vista docente: solo sus grupos, con los permisos de su asignacion
  {
    path: 'docente',
    loadComponent: () => import('./docente/docente-shell').then((m) => m.DocenteShell),
    children: [
      { path: '', loadComponent: () => import('./docente/mis-cursos').then((m) => m.MisCursos) },
      { path: 'horario', loadComponent: () => import('./docente/mi-horario').then((m) => m.MiHorario) },
      { path: 'actividades', loadComponent: () => import('./comun/calendario-actividades').then((m) => m.CalendarioActividades) },
      { path: 'registro-notas', loadComponent: () => import('./evaluacion/registro-notas').then((m) => m.RegistroNotas) },
      { path: 'control-asistencia', loadComponent: () => import('./evaluacion/asistencia').then((m) => m.Asistencia) },
    ],
  },
  {
    path: ':modulo',
    loadComponent: () => import('./shell/shell').then((m) => m.Shell),
    children: [
      { path: '', loadComponent: () => import('./inicio/modulo-inicio').then((m) => m.ModuloInicio) },
      { path: 's/:seccion', loadComponent: () => import('./seccion/seccion').then((m) => m.Seccion) },
      { path: 'plan-estudios', loadComponent: () => import('./curriculo/plan-estudios').then((m) => m.PlanEstudios) },
      { path: 'grupos', loadComponent: () => import('./planificacion/grupos-horario').then((m) => m.GruposHorario) },
      { path: 'actas', loadComponent: () => import('./evaluacion/actas').then((m) => m.Actas) },
      { path: 'registro-notas', loadComponent: () => import('./evaluacion/registro-notas').then((m) => m.RegistroNotas) },
      { path: 'control-asistencia', loadComponent: () => import('./evaluacion/asistencia').then((m) => m.Asistencia) },
      { path: 'horarios', loadComponent: () => import('./planificacion/horarios-vista').then((m) => m.HorariosVista) },
      { path: 'actividades', loadComponent: () => import('./comun/calendario-actividades').then((m) => m.CalendarioActividades) },
      { path: 'carga-docente', loadComponent: () => import('./planificacion/carga-docente').then((m) => m.CargaDocente) },
      { path: 'bandeja', loadComponent: () => import('./comun/bandeja').then((m) => m.Bandeja) },
      { path: 'reportes', loadComponent: () => import('./evaluacion/reportes').then((m) => m.Reportes) },
    ],
  },
];
