import { mensajeError } from '../../core/http/mensaje-error';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { ConceptosPagoService } from '../conceptos-pago/conceptos-pago-service';
import { ConceptosPagoResponse } from '../conceptos-pago/conceptos-pago.model';
import { PersonaService } from '../personas/persona-service';
import { PersonaResponse } from '../personas/persona.model';
import { PagoService } from './pago-service';

import { SinGuion } from '../../core/sin-guion.pipe';
/**
 * Nuevo pago via Mercado Pago (Checkout Pro): aqui solo se registra persona, concepto y monto.
 * El metodo (tarjeta, Yape, PagoEfectivo...) se elige en la pagina de Mercado Pago; al volver,
 * /pagos/resultado confirma el pago y el backend guarda el metodo real que se uso.
 */
@Component({
  selector: 'app-pago-form',
  imports: [SinGuion, ReactiveFormsModule, RouterLink],
  templateUrl: './pago-form.html',
})
export class PagoForm {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PagoService);
  private readonly personaService = inject(PersonaService);
  private readonly conceptosService = inject(ConceptosPagoService);

  protected readonly error = signal<string | null>(null);
  protected readonly enviando = signal(false);
  protected readonly personas = signal<PersonaResponse[]>([]);
  // Conceptos de pago vigentes, creados en el apartado "Conceptos de pago".
  protected readonly conceptos = signal<ConceptosPagoResponse[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    idPersona: [null as number | null, [Validators.required]],
    idConcepto: [null as number | null, [Validators.required]],
    monto: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  constructor() {
    this.personaService.listar().subscribe({
      next: (p) => this.personas.set(p),
      error: (e) => this.error.set(mensajeError(e, 'No se pudieron cargar las personas.')),
    });
    this.conceptosService.listar().subscribe({
      next: (c) => this.conceptos.set(c.filter((x) => this.esVigente(x))),
      error: (e) => this.error.set(mensajeError(e, 'No se pudieron cargar los conceptos de pago.')),
    });
    // Al elegir un concepto se rellena el monto con el definido en el concepto (sigue editable).
    this.form.controls.idConcepto.valueChanges.subscribe((id) => {
      const concepto = this.conceptos().find((c) => c.id === Number(id));
      if (concepto?.monto != null) {
        this.form.controls.monto.setValue(concepto.monto);
      }
    });
  }

  // Vigente hoy: ya empezo y no ha vencido (vigenciaHasta vacia = sin vencimiento).
  private esVigente(c: ConceptosPagoResponse): boolean {
    const hoy = new Date().toISOString().slice(0, 10);
    return c.vigenciaDesde <= hoy && (c.vigenciaHasta == null || c.vigenciaHasta >= hoy);
  }

  // Crea el pago (EN_PROCESO, metodo MERCADOPAGO), genera la preferencia y manda el navegador
  // a Mercado Pago.
  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.enviando.set(true);
    const valores = this.form.getRawValue();
    const concepto = this.conceptos().find((c) => c.id === Number(valores.idConcepto));
    if (!concepto) {
      this.error.set('Selecciona un concepto de pago.');
      this.enviando.set(false);
      return;
    }
    this.service
      .procesar({
        idPersona: Number(valores.idPersona),
        matriculaId: null,
        concepto: concepto.nombre,
        monto: Number(valores.monto),
        metodo: 'MERCADOPAGO',
      })
      .pipe(switchMap((pago) => this.service.crearPreferencia(pago.id)))
      .subscribe({
        // Con credenciales de usuario de prueba (APP_USR) se usa init_point, no sandbox_init_point.
        next: (pref) => (window.location.href = pref.initPoint || pref.sandboxInitPoint),
        error: (e) => {
          this.error.set(mensajeError(e, 'No se pudo iniciar el pago en Mercado Pago.'));
          this.enviando.set(false);
        },
      });
  }
}
