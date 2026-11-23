import { Routes } from '@angular/router';
import { AuthCallback } from './core/auth/auth-callback';

export const routes: Routes = [
  {
    path: 'auth/callback',
    component: AuthCallback,
  },
  // Portal academico del Modulo 02 (curriculo, planificacion, evaluacion)
  {
    path: 'academico',
    loadChildren: () => import('./academico/academico.routes').then((m) => m.ACADEMICO_ROUTES),
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  // --- Paginas publicas (sin shell, sin login) ---
  {
    path: 'publico/pagar',
    loadComponent: () => import('./features/publico/pagar.component').then(m => m.PagarComponent)
  },
  {
    path: 'publico/seguimiento',
    loadComponent: () => import('./features/publico/seguimiento.component').then(m => m.SeguimientoComponent)
  },
  {
    path: 'publico/admision',
    loadComponent: () => import('./features/publico/admision-landing.component').then(m => m.AdmisionLandingComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    children: [
      // --- B-Learning (LMS) ---
      {
        path: 'b-learning',
        loadComponent: () => import('./features/b-learning/portal-cursos.component').then(m => m.PortalCursosComponent)
      },
      // --- Admision / Trayectoria (CRUD generico, origen) ---
      {
        path: 'crud/adjudicaciones',
        loadComponent: () => import('./features/admision/vacantes-ingreso.component').then(m => m.VacantesIngresoComponent)
      },
      {
        path: 'crud/:slug',
        loadComponent: () => import('./features/crud-generic/crud-generic.component').then(m => m.CrudGenericComponent)
      },
      // --- Finanzas / LMS (UNIDAD-2.1) ---
      {
        path: 'estado-cuenta',
        loadComponent: () => import('./features/estado-cuenta/estado-cuenta.component').then(m => m.EstadoCuentaComponent)
      },
      {
        path: 'realizar-pago',
        loadComponent: () => import('./features/realizar-pago/realizar-pago.component').then(m => m.RealizarPagoComponent)
      },
      {
        path: 'sin-acceso',
        loadComponent: () => import('./features/sin-acceso/sin-acceso.component').then(m => m.SinAccesoComponent)
      },
      {
        path: 'enrolar',
        loadComponent: () => import('./features/enrolar/enrolar.component').then(m => m.EnrolarComponent)
      },
      {
        path: 'admision/reniec',
        loadComponent: () => import('./features/admision/reniec-buscador.component').then(m => m.ReniecBuscadorComponent)
      },
      {
        path: 'admision/nueva-postulacion',
        loadComponent: () => import('./features/admision/wizard-postulacion.component').then(m => m.WizardPostulacionComponent)
      },
      {
        path: 'postulaciones',
        loadComponent: () => import('./features/admision/postulaciones.component').then(m => m.PostulacionesComponent),
      },
      {
        path: 'postulaciones/nueva',
        loadComponent: () => import('./features/admision/wizard-postulacion.component').then(m => m.WizardPostulacionComponent),
      },
      {
        path: 'trayectoria/plan',
        loadComponent: () => import('./features/trayectoria/plan-academico.component').then(m => m.PlanAcademicoComponent)
      },
      {
        path: 'mi-trayectoria',
        loadComponent: () => import('./features/trayectoria/mi-trayectoria.component').then(m => m.MiTrayectoriaComponent),
      },
      {
        path: 'trayectoria/alertas',
        loadComponent: () => import('./features/trayectoria/alertas.component').then(m => m.AlertasComponent),
      },
      {
        path: 'admision/prospectos',
        loadComponent: () => import('./features/admision/prospectos.component').then(m => m.ProspectosComponent),
      },
      {
        path: 'admision/derecho-admision',
        loadComponent: () => import('./features/admision/derecho-admision.component').then(m => m.DerechoAdmisionComponent),
      },
      {
        path: 'admision',
        loadComponent: () => import('./features/admision/admision-home.component').then(m => m.AdmisionHomeComponent),
      },
      {
        path: 'trayectoria',
        loadComponent: () => import('./features/trayectoria/trayectoria-home.component').then(m => m.TrayectoriaHomeComponent),
      },

      // --- Gestion academica (destino) ---
      {
        path: 'personas',
        loadComponent: () => import('./features/personas/persona-list').then((m) => m.PersonaList),
      },
      {
        path: 'personas/nueva',
        loadComponent: () => import('./features/personas/persona-form').then((m) => m.PersonaForm),
      },
      {
        path: 'personas/:id/editar',
        loadComponent: () => import('./features/personas/persona-form').then((m) => m.PersonaForm),
      },
      {
        path: 'facultades',
        loadComponent: () => import('./features/facultades/facultad-list').then((m) => m.FacultadList),
      },
      {
        path: 'facultades/nueva',
        loadComponent: () => import('./features/facultades/facultad-form').then((m) => m.FacultadForm),
      },
      {
        path: 'facultades/:id/editar',
        loadComponent: () => import('./features/facultades/facultad-form').then((m) => m.FacultadForm),
      },
      {
        path: 'programas',
        loadComponent: () => import('./features/programas/programa-list').then((m) => m.ProgramaList),
      },
      {
        path: 'programas/nueva',
        loadComponent: () => import('./features/programas/programa-form').then((m) => m.ProgramaForm),
      },
      {
        path: 'programas/:id/editar',
        loadComponent: () => import('./features/programas/programa-form').then((m) => m.ProgramaForm),
      },
      {
        path: 'cursos',
        loadComponent: () => import('./features/cursos/curso-list').then((m) => m.CursoList),
      },
      {
        path: 'grupos',
        loadComponent: () => import('./features/grupos/grupo-list').then((m) => m.GrupoList),
      },
      {
        path: 'grupos/nuevo',
        loadComponent: () => import('./features/grupos/grupo-form').then((m) => m.GrupoForm),
      },
      {
        path: 'grupos/:id/editar',
        loadComponent: () => import('./features/grupos/grupo-form').then((m) => m.GrupoForm),
      },
      { path: 'secciones', redirectTo: 'grupos' },
      {
        path: 'planes-estudio',
        loadComponent: () => import('./features/planes-estudio/plan-estudio-list').then((m) => m.PlanEstudioList),
      },
      {
        path: 'planes-estudio/nueva',
        loadComponent: () => import('./features/planes-estudio/plan-estudio-form').then((m) => m.PlanEstudioForm),
      },
      {
        path: 'planes-estudio/:id',
        loadComponent: () => import('./features/planes-estudio/plan-estudio-detalle').then((m) => m.PlanEstudioDetalle),
      },
      {
        path: 'planes-estudio/:id/editar',
        loadComponent: () => import('./features/planes-estudio/plan-estudio-form').then((m) => m.PlanEstudioForm),
      },
      {
        path: 'matriculas',
        loadComponent: () => import('./features/matriculas/matricula-list').then((m) => m.MatriculaList),
      },
      {
        path: 'matriculas/nueva',
        loadComponent: () => import('./features/matriculas/matricula-form').then((m) => m.MatriculaForm),
      },
      {
        path: 'matriculas/:id/editar',
        loadComponent: () => import('./features/matriculas/matricula-form').then((m) => m.MatriculaForm),
      },
      {
        path: 'notas',
        loadComponent: () => import('./features/notas/nota-list').then((m) => m.NotaList),
      },
      {
        path: 'notas/nueva',
        loadComponent: () => import('./features/notas/nota-form').then((m) => m.NotaForm),
      },
      {
        path: 'notas/:id/editar',
        loadComponent: () => import('./features/notas/nota-form').then((m) => m.NotaForm),
      },
      {
        path: 'actas',
        loadComponent: () => import('./features/actas/acta-list').then((m) => m.ActaList),
      },
      {
        path: 'pagos',
        loadComponent: () => import('./features/pagos/pago-list').then((m) => m.PagoList),
      },
      {
        path: 'pagos/nueva',
        loadComponent: () => import('./features/pagos/pago-form').then((m) => m.PagoForm),
      },
      {
        path: 'pagos/resultado',
        loadComponent: () => import('./features/pagos/pago-resultado.component').then((m) => m.PagoResultadoComponent),
      },

      // --- Matricula_Finanzas (convertido a estilo Lamb_UPeU: feature-file-group por recurso) ---
      {
        path: 'vouchers',
        loadComponent: () => import('./features/vouchers/vouchers-list').then((m) => m.VouchersList),
      },
      {
        path: 'vouchers/nueva',
        loadComponent: () => import('./features/vouchers/vouchers-form').then((m) => m.VouchersForm),
      },
      {
        path: 'vouchers/:id/editar',
        loadComponent: () => import('./features/vouchers/vouchers-form').then((m) => m.VouchersForm),
      },
      {
        path: 'recaudaciones-ventanilla',
        loadComponent: () => import('./features/recaudaciones-ventanilla/recaudaciones-ventanilla-list').then((m) => m.RecaudacionesVentanillaList),
      },
      {
        path: 'recaudaciones-ventanilla/nueva',
        loadComponent: () => import('./features/recaudaciones-ventanilla/recaudaciones-ventanilla-form').then((m) => m.RecaudacionesVentanillaForm),
      },
      {
        path: 'recaudaciones-ventanilla/:id/editar',
        loadComponent: () => import('./features/recaudaciones-ventanilla/recaudaciones-ventanilla-form').then((m) => m.RecaudacionesVentanillaForm),
      },
      {
        path: 'cuentas',
        loadComponent: () => import('./features/cuentas/cuentas-list').then((m) => m.CuentasList),
      },
      {
        path: 'cuentas/nueva',
        loadComponent: () => import('./features/cuentas/cuentas-form').then((m) => m.CuentasForm),
      },
      {
        path: 'cuentas/:id/editar',
        loadComponent: () => import('./features/cuentas/cuentas-form').then((m) => m.CuentasForm),
      },
      {
        path: 'movimientos',
        loadComponent: () => import('./features/movimientos/movimientos-list').then((m) => m.MovimientosList),
      },
      {
        path: 'movimientos/nueva',
        loadComponent: () => import('./features/movimientos/movimientos-form').then((m) => m.MovimientosForm),
      },
      {
        path: 'movimientos/:id/editar',
        loadComponent: () => import('./features/movimientos/movimientos-form').then((m) => m.MovimientosForm),
      },
      {
        path: 'saldos-periodo',
        loadComponent: () => import('./features/saldos-periodo/saldos-periodo-list').then((m) => m.SaldosPeriodoList),
      },
      {
        path: 'saldos-periodo/nueva',
        loadComponent: () => import('./features/saldos-periodo/saldos-periodo-form').then((m) => m.SaldosPeriodoForm),
      },
      {
        path: 'saldos-periodo/:id/editar',
        loadComponent: () => import('./features/saldos-periodo/saldos-periodo-form').then((m) => m.SaldosPeriodoForm),
      },
      {
        path: 'ajustes-manuales',
        loadComponent: () => import('./features/ajustes-manuales/ajustes-manuales-list').then((m) => m.AjustesManualesList),
      },
      {
        path: 'ajustes-manuales/nueva',
        loadComponent: () => import('./features/ajustes-manuales/ajustes-manuales-form').then((m) => m.AjustesManualesForm),
      },
      {
        path: 'ajustes-manuales/:id/editar',
        loadComponent: () => import('./features/ajustes-manuales/ajustes-manuales-form').then((m) => m.AjustesManualesForm),
      },
      {
        path: 'reservas-devolucion',
        loadComponent: () => import('./features/reservas-devolucion/reservas-devolucion-list').then((m) => m.ReservasDevolucionList),
      },
      {
        path: 'reservas-devolucion/nueva',
        loadComponent: () => import('./features/reservas-devolucion/reservas-devolucion-form').then((m) => m.ReservasDevolucionForm),
      },
      {
        path: 'reservas-devolucion/:id/editar',
        loadComponent: () => import('./features/reservas-devolucion/reservas-devolucion-form').then((m) => m.ReservasDevolucionForm),
      },
      {
        path: 'categorias-concepto',
        loadComponent: () => import('./features/categorias-concepto/categorias-concepto-list').then((m) => m.CategoriasConceptoList),
      },
      {
        path: 'categorias-concepto/nueva',
        loadComponent: () => import('./features/categorias-concepto/categorias-concepto-form').then((m) => m.CategoriasConceptoForm),
      },
      {
        path: 'categorias-concepto/:id/editar',
        loadComponent: () => import('./features/categorias-concepto/categorias-concepto-form').then((m) => m.CategoriasConceptoForm),
      },
      {
        path: 'conceptos-pago',
        loadComponent: () => import('./features/conceptos-pago/conceptos-pago-list').then((m) => m.ConceptosPagoList),
      },
      {
        path: 'conceptos-pago/nueva',
        loadComponent: () => import('./features/conceptos-pago/conceptos-pago-form').then((m) => m.ConceptosPagoForm),
      },
      {
        path: 'conceptos-pago/:id/editar',
        loadComponent: () => import('./features/conceptos-pago/conceptos-pago-form').then((m) => m.ConceptosPagoForm),
      },
      {
        path: 'tarifarios-escuela-ciclo',
        loadComponent: () => import('./features/tarifarios-escuela-ciclo/tarifarios-escuela-ciclo-list').then((m) => m.TarifariosEscuelaCicloList),
      },
      {
        path: 'tarifarios-escuela-ciclo/nueva',
        loadComponent: () => import('./features/tarifarios-escuela-ciclo/tarifarios-escuela-ciclo-form').then((m) => m.TarifariosEscuelaCicloForm),
      },
      {
        path: 'tarifarios-escuela-ciclo/:id/editar',
        loadComponent: () => import('./features/tarifarios-escuela-ciclo/tarifarios-escuela-ciclo-form').then((m) => m.TarifariosEscuelaCicloForm),
      },
      {
        path: 'cronogramas-vencimiento',
        loadComponent: () => import('./features/cronogramas-vencimiento/cronogramas-vencimiento-list').then((m) => m.CronogramasVencimientoList),
      },
      {
        path: 'cronogramas-vencimiento/nueva',
        loadComponent: () => import('./features/cronogramas-vencimiento/cronogramas-vencimiento-form').then((m) => m.CronogramasVencimientoForm),
      },
      {
        path: 'cronogramas-vencimiento/:id/editar',
        loadComponent: () => import('./features/cronogramas-vencimiento/cronogramas-vencimiento-form').then((m) => m.CronogramasVencimientoForm),
      },
      {
        path: 'plantillas-plan-pago',
        loadComponent: () => import('./features/plantillas-plan-pago/plantillas-plan-pago-list').then((m) => m.PlantillasPlanPagoList),
      },
      {
        path: 'plantillas-plan-pago/nueva',
        loadComponent: () => import('./features/plantillas-plan-pago/plantillas-plan-pago-form').then((m) => m.PlantillasPlanPagoForm),
      },
      {
        path: 'plantillas-plan-pago/:id/editar',
        loadComponent: () => import('./features/plantillas-plan-pago/plantillas-plan-pago-form').then((m) => m.PlantillasPlanPagoForm),
      },
      {
        path: 'tipos-descuento',
        loadComponent: () => import('./features/tipos-descuento/tipos-descuento-list').then((m) => m.TiposDescuentoList),
      },
      {
        path: 'tipos-descuento/nueva',
        loadComponent: () => import('./features/tipos-descuento/tipos-descuento-form').then((m) => m.TiposDescuentoForm),
      },
      {
        path: 'tipos-descuento/:id/editar',
        loadComponent: () => import('./features/tipos-descuento/tipos-descuento-form').then((m) => m.TiposDescuentoForm),
      },
      {
        path: 'descuentos-aplicados',
        loadComponent: () => import('./features/descuentos-aplicados/descuentos-aplicados-list').then((m) => m.DescuentosAplicadosList),
      },
      {
        path: 'descuentos-aplicados/nueva',
        loadComponent: () => import('./features/descuentos-aplicados/descuentos-aplicados-form').then((m) => m.DescuentosAplicadosForm),
      },
      {
        path: 'descuentos-aplicados/:id/editar',
        loadComponent: () => import('./features/descuentos-aplicados/descuentos-aplicados-form').then((m) => m.DescuentosAplicadosForm),
      },
      {
        path: 'convenios-institucionales-descuento',
        loadComponent: () => import('./features/convenios-institucionales-descuento/convenios-institucionales-descuento-list').then((m) => m.ConveniosInstitucionalesDescuentoList),
      },
      {
        path: 'convenios-institucionales-descuento/nueva',
        loadComponent: () => import('./features/convenios-institucionales-descuento/convenios-institucionales-descuento-form').then((m) => m.ConveniosInstitucionalesDescuentoForm),
      },
      {
        path: 'convenios-institucionales-descuento/:id/editar',
        loadComponent: () => import('./features/convenios-institucionales-descuento/convenios-institucionales-descuento-form').then((m) => m.ConveniosInstitucionalesDescuentoForm),
      },
      {
        path: 'exoneraciones-pago',
        loadComponent: () => import('./features/exoneraciones-pago/exoneraciones-pago-list').then((m) => m.ExoneracionesPagoList),
      },
      {
        path: 'exoneraciones-pago/nueva',
        loadComponent: () => import('./features/exoneraciones-pago/exoneraciones-pago-form').then((m) => m.ExoneracionesPagoForm),
      },
      {
        path: 'exoneraciones-pago/:id/editar',
        loadComponent: () => import('./features/exoneraciones-pago/exoneraciones-pago-form').then((m) => m.ExoneracionesPagoForm),
      },
      {
        path: 'tipos-beca',
        loadComponent: () => import('./features/tipos-beca/tipos-beca-list').then((m) => m.TiposBecaList),
      },
      {
        path: 'tipos-beca/nueva',
        loadComponent: () => import('./features/tipos-beca/tipos-beca-form').then((m) => m.TiposBecaForm),
      },
      {
        path: 'tipos-beca/:id/editar',
        loadComponent: () => import('./features/tipos-beca/tipos-beca-form').then((m) => m.TiposBecaForm),
      },
      {
        path: 'becas-aplicadas',
        loadComponent: () => import('./features/becas-aplicadas/becas-aplicadas-list').then((m) => m.BecasAplicadasList),
      },
      {
        path: 'becas-aplicadas/nueva',
        loadComponent: () => import('./features/becas-aplicadas/becas-aplicadas-form').then((m) => m.BecasAplicadasForm),
      },
      {
        path: 'becas-aplicadas/:id/editar',
        loadComponent: () => import('./features/becas-aplicadas/becas-aplicadas-form').then((m) => m.BecasAplicadasForm),
      },
      {
        path: 'renovaciones-suspensiones-beca',
        loadComponent: () => import('./features/renovaciones-suspensiones-beca/renovaciones-suspensiones-beca-list').then((m) => m.RenovacionesSuspensionesBecaList),
      },
      {
        path: 'renovaciones-suspensiones-beca/nueva',
        loadComponent: () => import('./features/renovaciones-suspensiones-beca/renovaciones-suspensiones-beca-form').then((m) => m.RenovacionesSuspensionesBecaForm),
      },
      {
        path: 'renovaciones-suspensiones-beca/:id/editar',
        loadComponent: () => import('./features/renovaciones-suspensiones-beca/renovaciones-suspensiones-beca-form').then((m) => m.RenovacionesSuspensionesBecaForm),
      },
      {
        path: 'estados-cobro',
        loadComponent: () => import('./features/estados-cobro/estados-cobro-list').then((m) => m.EstadosCobroList),
      },
      {
        path: 'estados-cobro/nueva',
        loadComponent: () => import('./features/estados-cobro/estados-cobro-form').then((m) => m.EstadosCobroForm),
      },
      {
        path: 'estados-cobro/:id/editar',
        loadComponent: () => import('./features/estados-cobro/estados-cobro-form').then((m) => m.EstadosCobroForm),
      },
      {
        path: 'detalles-cobro',
        loadComponent: () => import('./features/detalles-cobro/detalles-cobro-list').then((m) => m.DetallesCobroList),
      },
      {
        path: 'detalles-cobro/nueva',
        loadComponent: () => import('./features/detalles-cobro/detalles-cobro-form').then((m) => m.DetallesCobroForm),
      },
      {
        path: 'detalles-cobro/:id/editar',
        loadComponent: () => import('./features/detalles-cobro/detalles-cobro-form').then((m) => m.DetallesCobroForm),
      },
      {
        path: 'historiales-estado-cobro',
        loadComponent: () => import('./features/historiales-estado-cobro/historiales-estado-cobro-list').then((m) => m.HistorialesEstadoCobroList),
      },
      {
        path: 'historiales-estado-cobro/nueva',
        loadComponent: () => import('./features/historiales-estado-cobro/historiales-estado-cobro-form').then((m) => m.HistorialesEstadoCobroForm),
      },
      {
        path: 'historiales-estado-cobro/:id/editar',
        loadComponent: () => import('./features/historiales-estado-cobro/historiales-estado-cobro-form').then((m) => m.HistorialesEstadoCobroForm),
      },
      {
        path: 'montos-pago',
        loadComponent: () => import('./features/montos-pago/montos-pago-list').then((m) => m.MontosPagoList),
      },
      {
        path: 'montos-pago/nueva',
        loadComponent: () => import('./features/montos-pago/montos-pago-form').then((m) => m.MontosPagoForm),
      },
      {
        path: 'montos-pago/:id/editar',
        loadComponent: () => import('./features/montos-pago/montos-pago-form').then((m) => m.MontosPagoForm),
      },
      {
        path: 'documentos-pago',
        loadComponent: () => import('./features/documentos-pago/documentos-pago-list').then((m) => m.DocumentosPagoList),
      },
      {
        path: 'documentos-pago/nueva',
        loadComponent: () => import('./features/documentos-pago/documentos-pago-form').then((m) => m.DocumentosPagoForm),
      },
      {
        path: 'documentos-pago/:id/editar',
        loadComponent: () => import('./features/documentos-pago/documentos-pago-form').then((m) => m.DocumentosPagoForm),
      },
      {
        path: 'series-correlativos-comprobante',
        loadComponent: () => import('./features/series-correlativos-comprobante/series-correlativos-comprobante-list').then((m) => m.SeriesCorrelativosComprobanteList),
      },
      {
        path: 'series-correlativos-comprobante/nueva',
        loadComponent: () => import('./features/series-correlativos-comprobante/series-correlativos-comprobante-form').then((m) => m.SeriesCorrelativosComprobanteForm),
      },
      {
        path: 'series-correlativos-comprobante/:id/editar',
        loadComponent: () => import('./features/series-correlativos-comprobante/series-correlativos-comprobante-form').then((m) => m.SeriesCorrelativosComprobanteForm),
      },
      {
        path: 'datos-facturacion-cliente',
        loadComponent: () => import('./features/datos-facturacion-cliente/datos-facturacion-cliente-list').then((m) => m.DatosFacturacionClienteList),
      },
      {
        path: 'datos-facturacion-cliente/nueva',
        loadComponent: () => import('./features/datos-facturacion-cliente/datos-facturacion-cliente-form').then((m) => m.DatosFacturacionClienteForm),
      },
      {
        path: 'datos-facturacion-cliente/:id/editar',
        loadComponent: () => import('./features/datos-facturacion-cliente/datos-facturacion-cliente-form').then((m) => m.DatosFacturacionClienteForm),
      },
      {
        path: 'anulaciones-comprobante',
        loadComponent: () => import('./features/anulaciones-comprobante/anulaciones-comprobante-list').then((m) => m.AnulacionesComprobanteList),
      },
      {
        path: 'anulaciones-comprobante/nueva',
        loadComponent: () => import('./features/anulaciones-comprobante/anulaciones-comprobante-form').then((m) => m.AnulacionesComprobanteForm),
      },
      {
        path: 'anulaciones-comprobante/:id/editar',
        loadComponent: () => import('./features/anulaciones-comprobante/anulaciones-comprobante-form').then((m) => m.AnulacionesComprobanteForm),
      },
      {
        path: 'notas-credito',
        loadComponent: () => import('./features/notas-credito/notas-credito-list').then((m) => m.NotasCreditoList),
      },
      {
        path: 'notas-credito/nueva',
        loadComponent: () => import('./features/notas-credito/notas-credito-form').then((m) => m.NotasCreditoForm),
      },
      {
        path: 'notas-credito/:id/editar',
        loadComponent: () => import('./features/notas-credito/notas-credito-form').then((m) => m.NotasCreditoForm),
      },
      {
        path: 'notas-debito',
        loadComponent: () => import('./features/notas-debito/notas-debito-list').then((m) => m.NotasDebitoList),
      },
      {
        path: 'notas-debito/nueva',
        loadComponent: () => import('./features/notas-debito/notas-debito-form').then((m) => m.NotasDebitoForm),
      },
      {
        path: 'notas-debito/:id/editar',
        loadComponent: () => import('./features/notas-debito/notas-debito-form').then((m) => m.NotasDebitoForm),
      },
      {
        path: 'solicitudes-devolucion',
        loadComponent: () => import('./features/solicitudes-devolucion/solicitudes-devolucion-list').then((m) => m.SolicitudesDevolucionList),
      },
      {
        path: 'solicitudes-devolucion/nueva',
        loadComponent: () => import('./features/solicitudes-devolucion/solicitudes-devolucion-form').then((m) => m.SolicitudesDevolucionForm),
      },
      {
        path: 'solicitudes-devolucion/:id/editar',
        loadComponent: () => import('./features/solicitudes-devolucion/solicitudes-devolucion-form').then((m) => m.SolicitudesDevolucionForm),
      },
      {
        path: 'reembolsos-pago',
        loadComponent: () => import('./features/reembolsos-pago/reembolsos-pago-list').then((m) => m.ReembolsosPagoList),
      },
      {
        path: 'reembolsos-pago/nueva',
        loadComponent: () => import('./features/reembolsos-pago/reembolsos-pago-form').then((m) => m.ReembolsosPagoForm),
      },
      {
        path: 'reembolsos-pago/:id/editar',
        loadComponent: () => import('./features/reembolsos-pago/reembolsos-pago-form').then((m) => m.ReembolsosPagoForm),
      },
      {
        path: 'cancelaciones-cargo-matricula',
        loadComponent: () => import('./features/cancelaciones-cargo-matricula/cancelaciones-cargo-matricula-list').then((m) => m.CancelacionesCargoMatriculaList),
      },
      {
        path: 'cancelaciones-cargo-matricula/nueva',
        loadComponent: () => import('./features/cancelaciones-cargo-matricula/cancelaciones-cargo-matricula-form').then((m) => m.CancelacionesCargoMatriculaForm),
      },
      {
        path: 'cancelaciones-cargo-matricula/:id/editar',
        loadComponent: () => import('./features/cancelaciones-cargo-matricula/cancelaciones-cargo-matricula-form').then((m) => m.CancelacionesCargoMatriculaForm),
      },
      {
        path: 'transferencias-pago',
        loadComponent: () => import('./features/transferencias-pago/transferencias-pago-list').then((m) => m.TransferenciasPagoList),
      },
      {
        path: 'transferencias-pago/nueva',
        loadComponent: () => import('./features/transferencias-pago/transferencias-pago-form').then((m) => m.TransferenciasPagoForm),
      },
      {
        path: 'transferencias-pago/:id/editar',
        loadComponent: () => import('./features/transferencias-pago/transferencias-pago-form').then((m) => m.TransferenciasPagoForm),
      },
      {
        path: 'reclamos-pago',
        loadComponent: () => import('./features/reclamos-pago/reclamos-pago-list').then((m) => m.ReclamosPagoList),
      },
      {
        path: 'reclamos-pago/nueva',
        loadComponent: () => import('./features/reclamos-pago/reclamos-pago-form').then((m) => m.ReclamosPagoForm),
      },
      {
        path: 'reclamos-pago/:id/editar',
        loadComponent: () => import('./features/reclamos-pago/reclamos-pago-form').then((m) => m.ReclamosPagoForm),
      },
      {
        path: 'estados-cuenta-estudiante',
        loadComponent: () => import('./features/estados-cuenta-estudiante/estados-cuenta-estudiante-list').then((m) => m.EstadosCuentaEstudianteList),
      },
      {
        path: 'estados-cuenta-estudiante/nueva',
        loadComponent: () => import('./features/estados-cuenta-estudiante/estados-cuenta-estudiante-form').then((m) => m.EstadosCuentaEstudianteForm),
      },
      {
        path: 'estados-cuenta-estudiante/:id/editar',
        loadComponent: () => import('./features/estados-cuenta-estudiante/estados-cuenta-estudiante-form').then((m) => m.EstadosCuentaEstudianteForm),
      },
      {
        path: 'constancias-no-adeudo',
        loadComponent: () => import('./features/constancias-no-adeudo/constancias-no-adeudo-list').then((m) => m.ConstanciasNoAdeudoList),
      },
      {
        path: 'constancias-no-adeudo/nueva',
        loadComponent: () => import('./features/constancias-no-adeudo/constancias-no-adeudo-form').then((m) => m.ConstanciasNoAdeudoForm),
      },
      {
        path: 'constancias-no-adeudo/:id/editar',
        loadComponent: () => import('./features/constancias-no-adeudo/constancias-no-adeudo-form').then((m) => m.ConstanciasNoAdeudoForm),
      },
      {
        path: 'historial-estados-matricula',
        loadComponent: () => import('./features/historial-estados-matricula/historial-estados-matricula-list').then((m) => m.HistorialEstadosMatriculaList),
      },
      {
        path: 'historial-estados-matricula/nueva',
        loadComponent: () => import('./features/historial-estados-matricula/historial-estados-matricula-form').then((m) => m.HistorialEstadosMatriculaForm),
      },
      {
        path: 'historial-estados-matricula/:id/editar',
        loadComponent: () => import('./features/historial-estados-matricula/historial-estados-matricula-form').then((m) => m.HistorialEstadosMatriculaForm),
      },
      {
        path: 'matriculas-condicionales',
        loadComponent: () => import('./features/matriculas-condicionales/matriculas-condicionales-list').then((m) => m.MatriculasCondicionalesList),
      },
      {
        path: 'matriculas-condicionales/nueva',
        loadComponent: () => import('./features/matriculas-condicionales/matriculas-condicionales-form').then((m) => m.MatriculasCondicionalesForm),
      },
      {
        path: 'matriculas-condicionales/:id/editar',
        loadComponent: () => import('./features/matriculas-condicionales/matriculas-condicionales-form').then((m) => m.MatriculasCondicionalesForm),
      },
      {
        path: 'anulaciones-matricula',
        loadComponent: () => import('./features/anulaciones-matricula/anulaciones-matricula-list').then((m) => m.AnulacionesMatriculaList),
      },
      {
        path: 'anulaciones-matricula/nueva',
        loadComponent: () => import('./features/anulaciones-matricula/anulaciones-matricula-form').then((m) => m.AnulacionesMatriculaForm),
      },
      {
        path: 'anulaciones-matricula/:id/editar',
        loadComponent: () => import('./features/anulaciones-matricula/anulaciones-matricula-form').then((m) => m.AnulacionesMatriculaForm),
      },
      {
        path: 'observaciones-matricula',
        loadComponent: () => import('./features/observaciones-matricula/observaciones-matricula-list').then((m) => m.ObservacionesMatriculaList),
      },
      {
        path: 'observaciones-matricula/nueva',
        loadComponent: () => import('./features/observaciones-matricula/observaciones-matricula-form').then((m) => m.ObservacionesMatriculaForm),
      },
      {
        path: 'observaciones-matricula/:id/editar',
        loadComponent: () => import('./features/observaciones-matricula/observaciones-matricula-form').then((m) => m.ObservacionesMatriculaForm),
      },
      {
        path: 'notificaciones-matricula',
        loadComponent: () => import('./features/notificaciones-matricula/notificaciones-matricula-list').then((m) => m.NotificacionesMatriculaList),
      },
      {
        path: 'notificaciones-matricula/nueva',
        loadComponent: () => import('./features/notificaciones-matricula/notificaciones-matricula-form').then((m) => m.NotificacionesMatriculaForm),
      },
      {
        path: 'notificaciones-matricula/:id/editar',
        loadComponent: () => import('./features/notificaciones-matricula/notificaciones-matricula-form').then((m) => m.NotificacionesMatriculaForm),
      },
      {
        path: 'constancias-matricula',
        loadComponent: () => import('./features/constancias-matricula/constancias-matricula-list').then((m) => m.ConstanciasMatriculaList),
      },
      {
        path: 'constancias-matricula/nueva',
        loadComponent: () => import('./features/constancias-matricula/constancias-matricula-form').then((m) => m.ConstanciasMatriculaForm),
      },
      {
        path: 'constancias-matricula/:id/editar',
        loadComponent: () => import('./features/constancias-matricula/constancias-matricula-form').then((m) => m.ConstanciasMatriculaForm),
      },
      {
        path: 'tipos-matricula',
        loadComponent: () => import('./features/tipos-matricula/tipos-matricula-list').then((m) => m.TiposMatriculaList),
      },
      {
        path: 'tipos-matricula/nueva',
        loadComponent: () => import('./features/tipos-matricula/tipos-matricula-form').then((m) => m.TiposMatriculaForm),
      },
      {
        path: 'tipos-matricula/:id/editar',
        loadComponent: () => import('./features/tipos-matricula/tipos-matricula-form').then((m) => m.TiposMatriculaForm),
      },
      {
        path: 'periodos-academicos',
        loadComponent: () => import('./features/periodos-academicos/periodos-academicos-list').then((m) => m.PeriodosAcademicosList),
      },
      {
        path: 'periodos-academicos/nueva',
        loadComponent: () => import('./features/periodos-academicos/periodos-academicos-form').then((m) => m.PeriodosAcademicosForm),
      },
      {
        path: 'periodos-academicos/:id/editar',
        loadComponent: () => import('./features/periodos-academicos/periodos-academicos-form').then((m) => m.PeriodosAcademicosForm),
      },
      {
        path: 'tipos-periodo',
        loadComponent: () => import('./features/tipos-periodo/tipos-periodo-list').then((m) => m.TiposPeriodoList),
      },
      {
        path: 'tipos-periodo/nueva',
        loadComponent: () => import('./features/tipos-periodo/tipos-periodo-form').then((m) => m.TiposPeriodoForm),
      },
      {
        path: 'tipos-periodo/:id/editar',
        loadComponent: () => import('./features/tipos-periodo/tipos-periodo-form').then((m) => m.TiposPeriodoForm),
      },
      {
        path: 'modalidades-matricula',
        loadComponent: () => import('./features/modalidades-matricula/modalidades-matricula-list').then((m) => m.ModalidadesMatriculaList),
      },
      {
        path: 'modalidades-matricula/nueva',
        loadComponent: () => import('./features/modalidades-matricula/modalidades-matricula-form').then((m) => m.ModalidadesMatriculaForm),
      },
      {
        path: 'modalidades-matricula/:id/editar',
        loadComponent: () => import('./features/modalidades-matricula/modalidades-matricula-form').then((m) => m.ModalidadesMatriculaForm),
      },
      {
        path: 'cronogramas-matricula',
        loadComponent: () => import('./features/cronogramas-matricula/cronogramas-matricula-list').then((m) => m.CronogramasMatriculaList),
      },
      {
        path: 'cronogramas-matricula/nueva',
        loadComponent: () => import('./features/cronogramas-matricula/cronogramas-matricula-form').then((m) => m.CronogramasMatriculaForm),
      },
      {
        path: 'cronogramas-matricula/:id/editar',
        loadComponent: () => import('./features/cronogramas-matricula/cronogramas-matricula-form').then((m) => m.CronogramasMatriculaForm),
      },
      {
        path: 'variaciones-matricula',
        loadComponent: () => import('./features/variaciones-matricula/variaciones-matricula-list').then((m) => m.VariacionesMatriculaList),
      },
      {
        path: 'variaciones-matricula/nueva',
        loadComponent: () => import('./features/variaciones-matricula/variaciones-matricula-form').then((m) => m.VariacionesMatriculaForm),
      },
      {
        path: 'variaciones-matricula/:id/editar',
        loadComponent: () => import('./features/variaciones-matricula/variaciones-matricula-form').then((m) => m.VariacionesMatriculaForm),
      },
      {
        path: 'ampliaciones-plazo-matricula',
        loadComponent: () => import('./features/ampliaciones-plazo-matricula/ampliaciones-plazo-matricula-list').then((m) => m.AmpliacionesPlazoMatriculaList),
      },
      {
        path: 'ampliaciones-plazo-matricula/nueva',
        loadComponent: () => import('./features/ampliaciones-plazo-matricula/ampliaciones-plazo-matricula-form').then((m) => m.AmpliacionesPlazoMatriculaForm),
      },
      {
        path: 'ampliaciones-plazo-matricula/:id/editar',
        loadComponent: () => import('./features/ampliaciones-plazo-matricula/ampliaciones-plazo-matricula-form').then((m) => m.AmpliacionesPlazoMatriculaForm),
      },
      {
        path: 'requisitos-por-tipo-matricula',
        loadComponent: () => import('./features/requisitos-por-tipo-matricula/requisitos-por-tipo-matricula-list').then((m) => m.RequisitosPorTipoMatriculaList),
      },
      {
        path: 'requisitos-por-tipo-matricula/nueva',
        loadComponent: () => import('./features/requisitos-por-tipo-matricula/requisitos-por-tipo-matricula-form').then((m) => m.RequisitosPorTipoMatriculaForm),
      },
      {
        path: 'requisitos-por-tipo-matricula/:id/editar',
        loadComponent: () => import('./features/requisitos-por-tipo-matricula/requisitos-por-tipo-matricula-form').then((m) => m.RequisitosPorTipoMatriculaForm),
      },
      {
        path: 'bloqueos-matricula',
        loadComponent: () => import('./features/bloqueos-matricula/bloqueos-matricula-list').then((m) => m.BloqueosMatriculaList),
      },
      {
        path: 'bloqueos-matricula/nueva',
        loadComponent: () => import('./features/bloqueos-matricula/bloqueos-matricula-form').then((m) => m.BloqueosMatriculaForm),
      },
      {
        path: 'bloqueos-matricula/:id/editar',
        loadComponent: () => import('./features/bloqueos-matricula/bloqueos-matricula-form').then((m) => m.BloqueosMatriculaForm),
      },
      {
        path: 'compromisos-matricula',
        loadComponent: () => import('./features/compromisos-matricula/compromisos-matricula-list').then((m) => m.CompromisosMatriculaList),
      },
      {
        path: 'compromisos-matricula/nueva',
        loadComponent: () => import('./features/compromisos-matricula/compromisos-matricula-form').then((m) => m.CompromisosMatriculaForm),
      },
      {
        path: 'compromisos-matricula/:id/editar',
        loadComponent: () => import('./features/compromisos-matricula/compromisos-matricula-form').then((m) => m.CompromisosMatriculaForm),
      },
      {
        path: 'reservas-vacante',
        loadComponent: () => import('./features/reservas-vacante/reservas-vacante-list').then((m) => m.ReservasVacanteList),
      },
      {
        path: 'reservas-vacante/nueva',
        loadComponent: () => import('./features/reservas-vacante/reservas-vacante-form').then((m) => m.ReservasVacanteForm),
      },
      {
        path: 'reservas-vacante/:id/editar',
        loadComponent: () => import('./features/reservas-vacante/reservas-vacante-form').then((m) => m.ReservasVacanteForm),
      },
      {
        path: 'listas-espera-seccion',
        loadComponent: () => import('./features/listas-espera-seccion/listas-espera-seccion-list').then((m) => m.ListasEsperaSeccionList),
      },
      {
        path: 'listas-espera-seccion/nueva',
        loadComponent: () => import('./features/listas-espera-seccion/listas-espera-seccion-form').then((m) => m.ListasEsperaSeccionForm),
      },
      {
        path: 'listas-espera-seccion/:id/editar',
        loadComponent: () => import('./features/listas-espera-seccion/listas-espera-seccion-form').then((m) => m.ListasEsperaSeccionForm),
      },
      {
        path: 'ampliaciones-cupo',
        loadComponent: () => import('./features/ampliaciones-cupo/ampliaciones-cupo-list').then((m) => m.AmpliacionesCupoList),
      },
      {
        path: 'ampliaciones-cupo/nueva',
        loadComponent: () => import('./features/ampliaciones-cupo/ampliaciones-cupo-form').then((m) => m.AmpliacionesCupoForm),
      },
      {
        path: 'ampliaciones-cupo/:id/editar',
        loadComponent: () => import('./features/ampliaciones-cupo/ampliaciones-cupo-form').then((m) => m.AmpliacionesCupoForm),
      },
      {
        path: 'condiciones-matricula',
        loadComponent: () => import('./features/condiciones-matricula/condiciones-matricula-list').then((m) => m.CondicionesMatriculaList),
      },
      {
        path: 'condiciones-matricula/nueva',
        loadComponent: () => import('./features/condiciones-matricula/condiciones-matricula-form').then((m) => m.CondicionesMatriculaForm),
      },
      {
        path: 'condiciones-matricula/:id/editar',
        loadComponent: () => import('./features/condiciones-matricula/condiciones-matricula-form').then((m) => m.CondicionesMatriculaForm),
      },
      {
        path: 'situaciones-academicas-estudiante',
        loadComponent: () => import('./features/situaciones-academicas-estudiante/situaciones-academicas-estudiante-list').then((m) => m.SituacionesAcademicasEstudianteList),
      },
      {
        path: 'situaciones-academicas-estudiante/nueva',
        loadComponent: () => import('./features/situaciones-academicas-estudiante/situaciones-academicas-estudiante-form').then((m) => m.SituacionesAcademicasEstudianteForm),
      },
      {
        path: 'situaciones-academicas-estudiante/:id/editar',
        loadComponent: () => import('./features/situaciones-academicas-estudiante/situaciones-academicas-estudiante-form').then((m) => m.SituacionesAcademicasEstudianteForm),
      },
      {
        path: 'cambios-situacion-academica',
        loadComponent: () => import('./features/cambios-situacion-academica/cambios-situacion-academica-list').then((m) => m.CambiosSituacionAcademicaList),
      },
      {
        path: 'cambios-situacion-academica/nueva',
        loadComponent: () => import('./features/cambios-situacion-academica/cambios-situacion-academica-form').then((m) => m.CambiosSituacionAcademicaForm),
      },
      {
        path: 'cambios-situacion-academica/:id/editar',
        loadComponent: () => import('./features/cambios-situacion-academica/cambios-situacion-academica-form').then((m) => m.CambiosSituacionAcademicaForm),
      },
      {
        path: 'estudiantes-observados-suspendidos',
        loadComponent: () => import('./features/estudiantes-observados-suspendidos/estudiantes-observados-suspendidos-list').then((m) => m.EstudiantesObservadosSuspendidosList),
      },
      {
        path: 'estudiantes-observados-suspendidos/nueva',
        loadComponent: () => import('./features/estudiantes-observados-suspendidos/estudiantes-observados-suspendidos-form').then((m) => m.EstudiantesObservadosSuspendidosForm),
      },
      {
        path: 'estudiantes-observados-suspendidos/:id/editar',
        loadComponent: () => import('./features/estudiantes-observados-suspendidos/estudiantes-observados-suspendidos-form').then((m) => m.EstudiantesObservadosSuspendidosForm),
      },
      {
        path: 'movilidades-estudiantiles',
        loadComponent: () => import('./features/movilidades-estudiantiles/movilidades-estudiantiles-list').then((m) => m.MovilidadesEstudiantilesList),
      },
      {
        path: 'movilidades-estudiantiles/nueva',
        loadComponent: () => import('./features/movilidades-estudiantiles/movilidades-estudiantiles-form').then((m) => m.MovilidadesEstudiantilesForm),
      },
      {
        path: 'movilidades-estudiantiles/:id/editar',
        loadComponent: () => import('./features/movilidades-estudiantiles/movilidades-estudiantiles-form').then((m) => m.MovilidadesEstudiantilesForm),
      },
      {
        path: 'intentos-curso',
        loadComponent: () => import('./features/intentos-curso/intentos-curso-list').then((m) => m.IntentosCursoList),
      },
      {
        path: 'intentos-curso/nueva',
        loadComponent: () => import('./features/intentos-curso/intentos-curso-form').then((m) => m.IntentosCursoForm),
      },
      {
        path: 'intentos-curso/:id/editar',
        loadComponent: () => import('./features/intentos-curso/intentos-curso-form').then((m) => m.IntentosCursoForm),
      },
      {
        path: 'cargas-academicas-periodo',
        loadComponent: () => import('./features/cargas-academicas-periodo/cargas-academicas-periodo-list').then((m) => m.CargasAcademicasPeriodoList),
      },
      {
        path: 'cargas-academicas-periodo/nueva',
        loadComponent: () => import('./features/cargas-academicas-periodo/cargas-academicas-periodo-form').then((m) => m.CargasAcademicasPeriodoForm),
      },
      {
        path: 'cargas-academicas-periodo/:id/editar',
        loadComponent: () => import('./features/cargas-academicas-periodo/cargas-academicas-periodo-form').then((m) => m.CargasAcademicasPeriodoForm),
      },
      {
        path: 'elecciones-curso-electivo',
        loadComponent: () => import('./features/elecciones-curso-electivo/elecciones-curso-electivo-list').then((m) => m.EleccionesCursoElectivoList),
      },
      {
        path: 'elecciones-curso-electivo/nueva',
        loadComponent: () => import('./features/elecciones-curso-electivo/elecciones-curso-electivo-form').then((m) => m.EleccionesCursoElectivoForm),
      },
      {
        path: 'elecciones-curso-electivo/:id/editar',
        loadComponent: () => import('./features/elecciones-curso-electivo/elecciones-curso-electivo-form').then((m) => m.EleccionesCursoElectivoForm),
      },
      {
        path: 'cruces-horario-autorizados',
        loadComponent: () => import('./features/cruces-horario-autorizados/cruces-horario-autorizados-list').then((m) => m.CrucesHorarioAutorizadosList),
      },
      {
        path: 'cruces-horario-autorizados/nueva',
        loadComponent: () => import('./features/cruces-horario-autorizados/cruces-horario-autorizados-form').then((m) => m.CrucesHorarioAutorizadosForm),
      },
      {
        path: 'cruces-horario-autorizados/:id/editar',
        loadComponent: () => import('./features/cruces-horario-autorizados/cruces-horario-autorizados-form').then((m) => m.CrucesHorarioAutorizadosForm),
      },
      {
        path: 'liberaciones-excepcionales-prerrequisito',
        loadComponent: () => import('./features/liberaciones-excepcionales-prerrequisito/liberaciones-excepcionales-prerrequisito-list').then((m) => m.LiberacionesExcepcionalesPrerrequisitoList),
      },
      {
        path: 'liberaciones-excepcionales-prerrequisito/nueva',
        loadComponent: () => import('./features/liberaciones-excepcionales-prerrequisito/liberaciones-excepcionales-prerrequisito-form').then((m) => m.LiberacionesExcepcionalesPrerrequisitoForm),
      },
      {
        path: 'liberaciones-excepcionales-prerrequisito/:id/editar',
        loadComponent: () => import('./features/liberaciones-excepcionales-prerrequisito/liberaciones-excepcionales-prerrequisito-form').then((m) => m.LiberacionesExcepcionalesPrerrequisitoForm),
      },
      {
        path: 'sobrecargas-creditos-autorizadas',
        loadComponent: () => import('./features/sobrecargas-creditos-autorizadas/sobrecargas-creditos-autorizadas-list').then((m) => m.SobrecargasCreditosAutorizadasList),
      },
      {
        path: 'sobrecargas-creditos-autorizadas/nueva',
        loadComponent: () => import('./features/sobrecargas-creditos-autorizadas/sobrecargas-creditos-autorizadas-form').then((m) => m.SobrecargasCreditosAutorizadasForm),
      },
      {
        path: 'sobrecargas-creditos-autorizadas/:id/editar',
        loadComponent: () => import('./features/sobrecargas-creditos-autorizadas/sobrecargas-creditos-autorizadas-form').then((m) => m.SobrecargasCreditosAutorizadasForm),
      },
      {
        path: 'cargas-minimas-autorizadas',
        loadComponent: () => import('./features/cargas-minimas-autorizadas/cargas-minimas-autorizadas-list').then((m) => m.CargasMinimasAutorizadasList),
      },
      {
        path: 'cargas-minimas-autorizadas/nueva',
        loadComponent: () => import('./features/cargas-minimas-autorizadas/cargas-minimas-autorizadas-form').then((m) => m.CargasMinimasAutorizadasForm),
      },
      {
        path: 'cargas-minimas-autorizadas/:id/editar',
        loadComponent: () => import('./features/cargas-minimas-autorizadas/cargas-minimas-autorizadas-form').then((m) => m.CargasMinimasAutorizadasForm),
      },
      {
        path: 'solicitudes-rectificacion',
        loadComponent: () => import('./features/solicitudes-rectificacion/solicitudes-rectificacion-list').then((m) => m.SolicitudesRectificacionList),
      },
      {
        path: 'solicitudes-rectificacion/nueva',
        loadComponent: () => import('./features/solicitudes-rectificacion/solicitudes-rectificacion-form').then((m) => m.SolicitudesRectificacionForm),
      },
      {
        path: 'solicitudes-rectificacion/:id/editar',
        loadComponent: () => import('./features/solicitudes-rectificacion/solicitudes-rectificacion-form').then((m) => m.SolicitudesRectificacionForm),
      },
      {
        path: 'retiros-oficio',
        loadComponent: () => import('./features/retiros-oficio/retiros-oficio-list').then((m) => m.RetirosOficioList),
      },
      {
        path: 'retiros-oficio/nueva',
        loadComponent: () => import('./features/retiros-oficio/retiros-oficio-form').then((m) => m.RetirosOficioForm),
      },
      {
        path: 'retiros-oficio/:id/editar',
        loadComponent: () => import('./features/retiros-oficio/retiros-oficio-form').then((m) => m.RetirosOficioForm),
      },
      {
        path: 'retiros-inasistencia',
        loadComponent: () => import('./features/retiros-inasistencia/retiros-inasistencia-list').then((m) => m.RetirosInasistenciaList),
      },
      {
        path: 'retiros-inasistencia/nueva',
        loadComponent: () => import('./features/retiros-inasistencia/retiros-inasistencia-form').then((m) => m.RetirosInasistenciaForm),
      },
      {
        path: 'retiros-inasistencia/:id/editar',
        loadComponent: () => import('./features/retiros-inasistencia/retiros-inasistencia-form').then((m) => m.RetirosInasistenciaForm),
      },
      {
        path: 'reactivaciones-matricula-anulada',
        loadComponent: () => import('./features/reactivaciones-matricula-anulada/reactivaciones-matricula-anulada-list').then((m) => m.ReactivacionesMatriculaAnuladaList),
      },
      {
        path: 'reactivaciones-matricula-anulada/nueva',
        loadComponent: () => import('./features/reactivaciones-matricula-anulada/reactivaciones-matricula-anulada-form').then((m) => m.ReactivacionesMatriculaAnuladaForm),
      },
      {
        path: 'reactivaciones-matricula-anulada/:id/editar',
        loadComponent: () => import('./features/reactivaciones-matricula-anulada/reactivaciones-matricula-anulada-form').then((m) => m.ReactivacionesMatriculaAnuladaForm),
      },
      {
        path: 'anulaciones-masivas-impago',
        loadComponent: () => import('./features/anulaciones-masivas-impago/anulaciones-masivas-impago-list').then((m) => m.AnulacionesMasivasImpagoList),
      },
      {
        path: 'anulaciones-masivas-impago/nueva',
        loadComponent: () => import('./features/anulaciones-masivas-impago/anulaciones-masivas-impago-form').then((m) => m.AnulacionesMasivasImpagoForm),
      },
      {
        path: 'anulaciones-masivas-impago/:id/editar',
        loadComponent: () => import('./features/anulaciones-masivas-impago/anulaciones-masivas-impago-form').then((m) => m.AnulacionesMasivasImpagoForm),
      },
      {
        path: 'rehabilitaciones-matricula',
        loadComponent: () => import('./features/rehabilitaciones-matricula/rehabilitaciones-matricula-list').then((m) => m.RehabilitacionesMatriculaList),
      },
      {
        path: 'rehabilitaciones-matricula/nueva',
        loadComponent: () => import('./features/rehabilitaciones-matricula/rehabilitaciones-matricula-form').then((m) => m.RehabilitacionesMatriculaForm),
      },
      {
        path: 'rehabilitaciones-matricula/:id/editar',
        loadComponent: () => import('./features/rehabilitaciones-matricula/rehabilitaciones-matricula-form').then((m) => m.RehabilitacionesMatriculaForm),
      },

      // --- Modulo academico (origen Curriculo/Planificacion/Evaluacion), fuera de 'academico' ---
      {
        path: 'ms/:clave',
        loadComponent: () => import('./features/microservicios/microservicio-page').then((m) => m.MicroservicioPage),
      },
      {
        path: 'postulaciones-academicas',
        loadComponent: () => import('./features/postulaciones/postulacion-list').then((m) => m.PostulacionList),
      },
      {
        path: 'postulaciones-academicas/nueva',
        loadComponent: () => import('./features/postulaciones/postulacion-form').then((m) => m.PostulacionForm),
      },
    ],
  },
  { path: '**', redirectTo: '' }
];
