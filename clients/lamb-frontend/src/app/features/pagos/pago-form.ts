import { mensajeError } from '../../core/http/mensaje-error';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
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

  protected readonly error = signal<string | null>(null);
  protected readonly enviando = signal(false);
  protected readonly personas = signal<PersonaResponse[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    idPersona: [null as number | null, [Validators.required]],
    concepto: ['', [Validators.required, Validators.maxLength(150)]],
    monto: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  constructor() {
    this.personaService.listar().subscribe({
      next: (p) => this.personas.set(p),
      error: (e) => this.error.set(mensajeError(e, 'No se pudieron cargar las personas.')),
    });
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
    this.service
      .procesar({
        idPersona: Number(valores.idPersona),
        matriculaId: null,
        concepto: valores.concepto,
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
