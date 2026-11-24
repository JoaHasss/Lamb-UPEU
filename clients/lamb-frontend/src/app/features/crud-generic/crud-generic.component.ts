import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { CRUD_BY_SLUG, CrudDef, FieldDef } from '../cruds.catalog';

import { SinGuion } from '../../core/sin-guion.pipe';
@Component({
  selector: 'app-crud-generic',
  standalone: true,
  imports: [SinGuion, CommonModule, FormsModule, DatePipe],
  templateUrl: './crud-generic.component.html',
  styleUrl: './crud-generic.component.scss'
})
export class CrudGenericComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private location = inject(Location);

  back() { this.location.back(); }

  def = signal<CrudDef | null>(null);
  items = signal<any[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  form = signal<Record<string, any>>({});

  // Opciones cargadas para campos tipo 'ref'/'multiref' (FK), indexadas por field.key
  refOptions = signal<Record<string, any[]>>({});

  // Para campos 'ref' con searchable: texto escrito y si la lista de sugerencias está abierta, por field.key
  refSearchText = signal<Record<string, string>>({});
  refSearchOpen = signal<string | null>(null);

  // Filas de la tabla de union actualmente cargadas para campos 'multiref', indexadas por field.key
  multiRefJoins = signal<Record<string, any[]>>({});

  // Para la columna de tabla: ids seleccionados de 'multiref' por owner id, indexadas por field.key
  multiRefColumnIds = signal<Record<string, Record<number, number[]>>>({});

  // Para 'ownedlist': labels de los hijos agrupados por owner id, indexadas por field.key
  ownedListData = signal<Record<string, Record<number, string[]>>>({});

  // Para 'ownedlist' con formFields: objetos completos de los hijos agrupados por owner id, indexadas por field.key
  ownedListRows = signal<Record<string, Record<number, any[]>>>({});

  // Fila expandida (clic en ID) para mostrar sus 'ownedlist' debajo, en la misma tabla.
  expandedRowId = signal<number | null>(null);

  // Campo 'ownedlist' del CrudDef actual (si tiene), para saber si las filas son expandibles.
  ownedListField = computed<FieldDef | null>(() => (this.def()?.fields ?? []).find(fi => fi.type === 'ownedlist') ?? null);

  // Estado del formulario inline para crear/editar un hijo de 'ownedlist'.
  ownedListOpenFor = signal<number | null>(null);
  ownedListDraft = signal<Record<string, any> | null>(null);
  ownedListEditingId = signal<number | null>(null);

  toggleExpand(row: any) {
    if (!this.ownedListField()) return;
    this.expandedRowId.update(id => id === row.id ? null : row.id);
    this.cancelOwnedListForm();
  }

  expandedLabels(row: any): string[] {
    const field = this.ownedListField(); if (!field) return [];
    return this.ownedListData()[field.key]?.[row.id] ?? [];
  }

  ownedListItems(row: any): any[] {
    const field = this.ownedListField(); if (!field) return [];
    return this.ownedListRows()[field.key]?.[row.id] ?? [];
  }

  openOwnedListAdd(ownerId: number) {
    const field = this.ownedListField(); const ol = field?.ownedList; if (!ol?.formFields) return;
    const draft: Record<string, any> = {};
    for (const ff of ol.formFields) draft[ff.key] = ff.type === 'ref' ? null : '';
    this.ownedListDraft.set(draft);
    this.ownedListEditingId.set(null);
    this.ownedListOpenFor.set(ownerId);
  }

  openOwnedListEdit(ownerId: number, item: any) {
    const field = this.ownedListField(); const ol = field?.ownedList; if (!ol?.formFields) return;
    const draft: Record<string, any> = {};
    for (const ff of ol.formFields) draft[ff.key] = item[ff.key] ?? (ff.type === 'ref' ? null : '');
    this.ownedListDraft.set(draft);
    this.ownedListEditingId.set(item.id);
    this.ownedListOpenFor.set(ownerId);
  }

  cancelOwnedListForm() {
    this.ownedListDraft.set(null);
    this.ownedListEditingId.set(null);
    this.ownedListOpenFor.set(null);
  }

  updateOwnedListDraft(key: string, value: any) {
    this.ownedListDraft.update(d => d ? { ...d, [key]: value } : d);
  }

  saveOwnedListItem(ownerId: number) {
    const field = this.ownedListField(); const ol = field?.ownedList; if (!field || !ol) return;
    const draft = this.ownedListDraft(); if (!draft) return;
    const body: Record<string, any> = { ...draft };
    for (const k of Object.keys(body)) { if (body[k] === '' || body[k] === null) delete body[k]; }
    body[ol.ownerKey] = ownerId;
    const editingId = this.ownedListEditingId();
    const req = editingId ? this.api.put<any>(`${ol.refPath}/${editingId}`, body) : this.api.post<any>(ol.refPath, body);
    req.subscribe({
      next: () => { this.cancelOwnedListForm(); this.reloadOwnedList(field); },
      error: e => this.error.set(this.msg(e))
    });
  }

  deleteOwnedListItem(item: any) {
    const field = this.ownedListField(); const ol = field?.ownedList; if (!field || !ol) return;
    if (!confirm(`¿Eliminar el periodo "${item[ol.refLabelKey ?? 'nombre']}"?`)) return;
    this.api.delete<any>(`${ol.refPath}/${item.id}`).subscribe({
      next: () => this.reloadOwnedList(field),
      error: e => this.error.set(this.msg(e))
    });
  }

  private reloadOwnedList(field: FieldDef) {
    const ol = field.ownedList; if (!ol) return;
    this.api.list<any>(ol.refPath).subscribe({
      next: rows => {
        const list = Array.isArray(rows) ? rows : [];
        const byOwnerLabels: Record<number, string[]> = {};
        const byOwnerRows: Record<number, any[]> = {};
        for (const row of list) {
          const owner = row[ol.ownerKey];
          if (owner === null || owner === undefined) continue;
          (byOwnerLabels[owner] ??= []).push(String(row[ol.refLabelKey ?? 'nombre']));
          (byOwnerRows[owner] ??= []).push(row);
        }
        this.ownedListData.update(m => ({ ...m, [field.key]: byOwnerLabels }));
        this.ownedListRows.update(m => ({ ...m, [field.key]: byOwnerRows }));
      },
      error: () => {
        this.ownedListData.update(m => ({ ...m, [field.key]: {} }));
        this.ownedListRows.update(m => ({ ...m, [field.key]: {} }));
      }
    });
  }

  // Estado del buscador RENIEC embebido
  reniecDni = signal('');
  reniecLoading = signal(false);
  reniecResult = signal<{nombres: string|null, apellidoPaterno: string|null, apellidoMaterno: string|null, nombreCompleto: string|null, encontrado: boolean, fuente: string} | null>(null);
  reniecError = signal<string | null>(null);

  // Estado del dropzone de archivos (solo UI, no hay endpoint de upload real)
  fileDragOver = signal(false);

  listedFields = computed<FieldDef[]>(() => (this.def()?.fields ?? []).filter(f => f.listed));
  editableFields = computed<FieldDef[]>(() => (this.def()?.fields ?? []).filter(f => f.editable !== false));

  // Tabs UI: varios CrudDef relacionados (ej. catálogo + su tabla de uso) se muestran
  // como una sola pantalla con pestañas, sin fusionar nada en backend.
  tabOptions = computed<CrudDef[]>(() => {
    const group = this.def()?.tabGroup;
    if (!group || group.length < 2) return [];
    return group.map(s => CRUD_BY_SLUG.get(s)).filter((d): d is CrudDef => !!d);
  });

  selectTab(d: CrudDef) {
    if (d.slug === this.def()?.slug) return;
    this.def.set(d);
    this.showForm.set(false);
    this.load();
    this.resetForm();
    this.loadRefOptions(d);
  }

  constructor() {
    this.route.paramMap.subscribe(p => {
      const slug = p.get('slug');
      const d = slug ? CRUD_BY_SLUG.get(slug) : null;
      this.def.set(d ?? null);
      if (d) { this.load(); this.resetForm(); this.loadRefOptions(d); }
    });
  }

  loadRefOptions(d: CrudDef) {
    for (const field of d.fields) {
      const path = field.type === 'ref' || field.type === 'checkbox-single' ? field.refPath : field.type === 'multiref' ? field.multiRef?.refPath : null;
      if (!path) continue;
      this.api.list<any>(path).subscribe({
        next: r => this.refOptions.update(m => ({ ...m, [field.key]: Array.isArray(r) ? r : [] })),
        error: () => this.refOptions.update(m => ({ ...m, [field.key]: [] }))
      });
    }
    // Opciones 'ref' usadas dentro del formulario inline de 'ownedlist' (ej. Año académico, Tipo de periodo)
    for (const field of d.fields) {
      for (const ff of field.ownedList?.formFields ?? []) {
        if (ff.type !== 'ref' || !ff.refPath) continue;
        this.api.list<any>(ff.refPath).subscribe({
          next: r => this.refOptions.update(m => ({ ...m, [ff.key]: Array.isArray(r) ? r : [] })),
          error: () => this.refOptions.update(m => ({ ...m, [ff.key]: [] }))
        });
      }
    }
  }

  // Para campos 'ref' con refFilter: devuelve solo las opciones cuyo matchKey coincide
  // con el valor elegido en el campo padre (dependsOnKey). Sin padre elegido, no filtra.
  refOptionsFor(field: FieldDef): any[] {
    let all = this.refOptions()[field.key] ?? [];
    const rf = field.refFilter;
    if (!rf) return all;
    if (rf.staticMatch) {
      all = all.filter(o => o[rf.staticMatch!.key] === rf.staticMatch!.value);
    }
    if (rf.dependsOnKey && rf.matchKey) {
      const parentValue = this.form()[rf.dependsOnKey];
      if (parentValue !== null && parentValue !== undefined && parentValue !== '') {
        all = all.filter(o => o[rf.matchKey!] === parentValue);
      }
    }
    return all;
  }

  refLabel(field: FieldDef, id: any): string {
    if (id === null || id === undefined || id === '') return '—';
    const opt = (this.refOptions()[field.key] ?? []).find(o => o.id === id);
    return opt ? String(opt[field.refLabelKey ?? 'nombre']) : String(id);
  }

  // Para campos 'ref' con searchable: opciones que matchean el texto escrito, por label o por id.
  refSearchResults(field: FieldDef): any[] {
    const q = (this.refSearchText()[field.key] ?? '').trim().toLowerCase();
    const all = this.refOptionsFor(field);
    if (!q) return all.slice(0, 20);
    return all.filter(o => {
      const label = String(o[field.refLabelKey ?? 'nombre'] ?? '').toLowerCase();
      return label.includes(q) || String(o.id).includes(q);
    }).slice(0, 20);
  }

  onRefSearchInput(field: FieldDef, text: string) {
    this.refSearchText.update(m => ({ ...m, [field.key]: text }));
    this.refSearchOpen.set(field.key);
    if (!text) this.onRefChange(field, null);
  }

  openRefSearch(field: FieldDef) {
    this.refSearchOpen.set(field.key);
  }

  closeRefSearch(field: FieldDef) {
    setTimeout(() => {
      if (this.refSearchOpen() === field.key) this.refSearchOpen.set(null);
    }, 150);
  }

  selectRefSearch(field: FieldDef, opt: any) {
    this.onRefChange(field, opt.id);
    this.refSearchText.update(m => ({ ...m, [field.key]: String(opt[field.refLabelKey ?? 'nombre'] ?? opt.id) }));
    this.refSearchOpen.set(null);
  }

  load() {
    const d = this.def(); if (!d) return;
    this.loading.set(true); this.error.set(null);
    this.api.list<any>(d.path).subscribe({
      next: r => { this.items.set(Array.isArray(r) ? r : []); this.loading.set(false); this.loadMultiRefColumns(d); this.loadOwnedListColumns(d); },
      error: e => { this.error.set(this.msg(e)); this.loading.set(false); }
    });
  }

  private loadOwnedListColumns(d: CrudDef) {
    for (const field of d.fields) {
      if (!field.ownedList) continue;
      this.reloadOwnedList(field);
    }
  }

  private loadMultiRefColumns(d: CrudDef) {
    for (const field of d.fields) {
      const mr = field.multiRef; if (!mr) continue;
      this.api.list<any>(mr.joinPath).subscribe({
        next: rows => {
          const list = Array.isArray(rows) ? rows : [];
          const byOwner: Record<number, number[]> = {};
          for (const row of list) {
            const owner = row[mr.ownerKey];
            (byOwner[owner] ??= []).push(row[mr.valueKey]);
          }
          this.multiRefColumnIds.update(m => ({ ...m, [field.key]: byOwner }));
        },
        error: () => this.multiRefColumnIds.update(m => ({ ...m, [field.key]: {} }))
      });
    }
  }

  resetForm() {
    const d = this.def(); if (!d) return;
    const empty: Record<string, any> = {};
    for (const field of d.fields) {
      if (field.autoCode) { empty[field.key] = this.generarCodigo(field.autoCode); continue; }
      if (field.editable === false) continue;
      if (field.type === 'multiref') { empty[field.key] = []; continue; }
      empty[field.key] = field.default ?? (field.type === 'boolean' ? false : field.type === 'number' || field.type === 'decimal' ? null : '');
    }
    this.form.set(empty);
    this.editingId.set(null);
    this.multiRefJoins.set({});
    this.refSearchText.set({});
  }

  openCreate() {
    this.resetForm();
    this.resetReniec();
    this.showForm.set(true);
  }

  resetReniec() {
    this.reniecDni.set('');
    this.reniecResult.set(null);
    this.reniecError.set(null);
    this.reniecLoading.set(false);
  }

  openEdit(row: any) {
    const d = this.def(); if (!d) return;
    const data: Record<string, any> = {};
    for (const field of d.fields) {
      if (field.type === 'ref' || field.type === 'checkbox-single') {
        const nested = field.refResponseKey ? row[field.refResponseKey] : null;
        data[field.key] = row[field.key] ?? nested?.id ?? null;
      } else if (field.type === 'multiref') {
        data[field.key] = [];
      } else if (field.type === 'datetime' && row[field.key]) {
        data[field.key] = this.toDatetimeLocalValue(row[field.key]);
      } else {
        data[field.key] = row[field.key] ?? null;
      }
    }
    this.form.set(data);
    this.editingId.set(row.id ?? null);
    this.showForm.set(true);
    this.loadMultiRefJoins(d, row.id);
    const searchTexts: Record<string, string> = {};
    for (const field of d.fields) {
      if (field.searchable && data[field.key] != null) {
        searchTexts[field.key] = this.refLabel(field, data[field.key]);
      }
    }
    this.refSearchText.set(searchTexts);
  }

  private loadMultiRefJoins(d: CrudDef, ownerId: number) {
    for (const field of d.fields) {
      const mr = field.multiRef; if (!mr) continue;
      this.api.list<any>(`${mr.joinPath}?${mr.ownerKey}=${ownerId}`).subscribe({
        next: rows => {
          const list = Array.isArray(rows) ? rows : [];
          this.multiRefJoins.update(m => ({ ...m, [field.key]: list }));
          this.form.update(f => ({ ...f, [field.key]: list.map(r => r[mr.valueKey]) }));
        },
        error: () => this.multiRefJoins.update(m => ({ ...m, [field.key]: [] }))
      });
    }
  }

  toggleMultiRef(field: FieldDef, id: number, checked: boolean) {
    this.form.update(f => {
      const cur: number[] = f[field.key] ?? [];
      const next = checked ? [...cur, id] : cur.filter(v => v !== id);
      return { ...f, [field.key]: next };
    });
  }

  buscarReniec() {
    const dni = (this.reniecDni() || '').trim();
    if (!/^\d{8}$/.test(dni)) {
      this.reniecError.set('DNI debe tener 8 dígitos.');
      this.reniecResult.set(null);
      return;
    }
    this.reniecError.set(null);
    this.reniecLoading.set(true);
    this.api.get<any>(`/api/v1/admision/reniec/${dni}/resolver`).subscribe({
      next: r => {
        this.reniecResult.set(r);
        this.reniecLoading.set(false);
        if (!r.encontrado) {
          this.reniecError.set(`No se encontraron datos (${r.fuente}).`);
        } else if (r.idPersona) {
          this.updateField('idPersona', r.idPersona);
        }
      },
      error: e => {
        this.reniecLoading.set(false);
        this.reniecError.set(`Error RENIEC: ${e.status ?? ''} ${e.message ?? ''}`);
      }
    });
  }

  private generarCodigo(autoCode: true | { prefix: string }): string {
    const now = new Date();
    const anio = now.getFullYear();
    const semestre = now.getMonth() < 6 ? 1 : 2; // 0-5=ene-jun, 6-11=jul-dic
    if (typeof autoCode === 'object') {
      const romano = semestre === 1 ? 'I' : 'II';
      return autoCode.prefix ? `${autoCode.prefix}-${anio}-${romano}` : `${anio}-${romano}`;
    }
    const aleatorio = Math.floor(100 + Math.random() * 900);
    return `${anio}${semestre}${aleatorio}`;
  }

  private toDatetimeLocalValue(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  save() {
    const d = this.def(); if (!d) return;
    const body = { ...this.form() };
    for (const field of d.fields) {
      if (field.type === 'datetime' && body[field.key]) {
        body[field.key] = new Date(body[field.key]).toISOString();
      }
    }
    const multiRefFields = d.fields.filter(fi => fi.type === 'multiref');
    // quitar campos virtuales (empiezan con __) y vacios
    for (const k of Object.keys(body)) {
      if (k.startsWith('__') || body[k] === '' || body[k] === null) delete body[k];
    }
    const id = this.editingId();
    const req = id ? this.api.put<any>(`${d.path}/${id}`, body) : this.api.post<any>(d.path, body);
    req.subscribe({
      next: saved => {
        if (id) {
          this.items.update(a => a.map(x => x.id === id ? saved : x));
        } else {
          this.items.update(a => [saved, ...a]);
        }
        this.syncMultiRefFields(multiRefFields, saved.id);
        this.showForm.set(false);
        this.error.set(null);
        this.recomputeAutoRank(d);
      },
      error: e => this.error.set(this.msg(e))
    });
  }

  // Tras crear/editar: si el CrudDef tiene un campo con autoRank, recalcula 1..n dentro
  // de cada grupo (ej. idExamen) ordenando por mejor puntaje y, en empate, por quien entregó antes.
  // Sólo hace PUT a las filas cuyo valor cambió.
  private recomputeAutoRank(d: CrudDef) {
    const field = d.fields.find(fi => fi.autoRank);
    if (!field || !field.autoRank) return;
    const { groupByKey, scoreKey, tiebreakKey } = field.autoRank;
    const groups = new Map<any, any[]>();
    for (const row of this.items()) {
      const key = row[groupByKey];
      if (key === null || key === undefined) continue;
      (groups.get(key) ?? groups.set(key, []).get(key)!).push(row);
    }
    for (const rows of groups.values()) {
      rows.sort((a, b) => {
        const diff = (b[scoreKey] ?? 0) - (a[scoreKey] ?? 0);
        if (diff !== 0) return diff;
        return new Date(a[tiebreakKey] ?? 0).getTime() - new Date(b[tiebreakKey] ?? 0).getTime();
      });
      rows.forEach((row, idx) => {
        const rank = idx + 1;
        if (row[field.key] === rank) return;
        this.api.put<any>(`${d.path}/${row.id}`, { ...row, [field.key]: rank }).subscribe({
          next: updated => this.items.update(a => a.map(x => x.id === row.id ? updated : x)),
          error: () => {}
        });
      });
    }
  }

  private syncMultiRefFields(fields: FieldDef[], ownerId: number) {
    for (const field of fields) {
      const mr = field.multiRef; if (!mr) continue;
      const selected: number[] = this.form()[field.key] ?? [];
      const existing: any[] = this.multiRefJoins()[field.key] ?? [];
      const existingValueIds = existing.map(r => r[mr.valueKey]);
      const toAdd = selected.filter(v => !existingValueIds.includes(v));
      const toDelete = existing.filter(r => !selected.includes(r[mr.valueKey]));
      for (const v of toAdd) {
        this.api.post<any>(mr.joinPath, { [mr.ownerKey]: ownerId, [mr.valueKey]: v }).subscribe({ error: () => {} });
      }
      for (const r of toDelete) {
        this.api.delete<any>(`${mr.joinPath}/${r.id}`).subscribe({ error: () => {} });
      }
      // Actualizar de inmediato la columna de la tabla, sin esperar respuesta del servidor.
      this.multiRefColumnIds.update(m => ({ ...m, [field.key]: { ...(m[field.key] ?? {}), [ownerId]: selected } }));
    }
  }

  updateField(key: string, value: any) {
    this.form.update(f => ({ ...f, [key]: value }));
  }

  // Para campos 'ref' con suggestOnChange: sugiere un valor en otro campo sin sobrescribir lo que el usuario ya eligió.
  onRefChange(field: FieldDef, value: any) {
    this.updateField(field.key, value);
    // Si otros campos 'ref' dependen de este (refFilter), su selección actual puede
    // dejar de ser válida: se limpia para forzar a elegir una opción del nuevo subconjunto.
    for (const dependent of this.def()?.fields ?? []) {
      if (dependent.refFilter?.dependsOnKey === field.key) {
        this.updateField(dependent.key, null);
      }
    }
    // Campos deshabilitados que derivan su valor del objeto elegido en este 'ref' (ej. Grado <- Programa).
    for (const dependent of this.def()?.fields ?? []) {
      const dfr = dependent.derivedFromRef;
      if (!dfr || dfr.sourceKey !== field.key) continue;
      const chosen = (this.refOptions()[field.key] ?? []).find(o => o.id === value);
      let derived = chosen ? this.getPath(chosen, dfr.path) : null;
      if ((derived === null || derived === undefined || derived === '') && dfr.fallbackPath) {
        derived = chosen ? this.getPath(chosen, dfr.fallbackPath) : null;
      }
      this.updateField(dependent.key, derived ?? '');
    }
    const autoFill = field.autoFillOnChange;
    if (autoFill && value !== null) {
      const currentTarget = this.form()[autoFill.targetKey];
      if (currentTarget === null || currentTarget === undefined || currentTarget === '') {
        const chosenForFill = (this.refOptions()[field.key] ?? []).find(o => o.id === value);
        let filled = chosenForFill ? this.getPath(chosenForFill, autoFill.path) : null;
        const targetField = this.def()?.fields.find(fi => fi.key === autoFill.targetKey);
        if (filled !== null && filled !== undefined && filled !== '' && targetField?.type === 'datetime' && !String(filled).includes('T')) {
          filled = this.toDatetimeLocalValue(filled);
        }
        if (filled !== null && filled !== undefined && filled !== '') this.updateField(autoFill.targetKey, filled);
      }
    }
    const suggest = field.suggestOnChange;
    if (!suggest || value === null) return;
    const current = this.form()[suggest.targetKey];
    if (current !== null && current !== undefined && current !== '') return;
    const chosen = (this.refOptions()[field.key] ?? []).find(o => o.id === value);
    const chosenLabel = chosen ? String(chosen[field.refLabelKey ?? 'nombre']) : null;
    const targetLabel = chosenLabel ? suggest.labelMap[chosenLabel] : null;
    if (!targetLabel) return;
    const targetOption = (this.refOptions()[suggest.targetKey] ?? []).find(o => String(o['nombre']) === targetLabel);
    if (targetOption) this.updateField(suggest.targetKey, targetOption.id);
  }

  // Para 'checkbox-single': única opción seleccionable (mismo valor que un 'ref' escalar, pero con UI de checkbox).
  selectSingleRef(field: FieldDef, id: number) {
    const current = this.form()[field.key];
    this.onRefChange(field, current === id ? null : id);
  }

  private getPath(obj: any, path: string): any {
    return path.split('.').reduce((acc, key) => (acc === null || acc === undefined ? acc : acc[key]), obj);
  }

  // Para 'enum' con colorMap: clase del chip según el valor actual.
  chipClass(field: FieldDef, value: any): string {
    const color = field.colorMap?.[value];
    return color ? `chip chip--${color}` : 'chip';
  }

  private applyPickedFile(file: File | undefined, field: FieldDef) {
    if (!file) return;
    this.updateField(field.key, file.name);
    if (field.fileNameTarget) this.updateField(field.fileNameTarget, file.name);
    if (field.fileUrlTarget) this.updateField(field.fileUrlTarget, URL.createObjectURL(file));
  }

  onFileSelected(ev: Event, field: FieldDef) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    this.applyPickedFile(file, field);
  }

  onFileDrop(ev: DragEvent, field: FieldDef) {
    ev.preventDefault();
    this.fileDragOver.set(false);
    const file = ev.dataTransfer?.files?.[0];
    this.applyPickedFile(file, field);
  }

  multiRefLabels(row: any, field: FieldDef): string[] {
    const mr = field.multiRef; if (!mr) return [];
    const ids = this.multiRefColumnIds()[field.key]?.[row.id] ?? [];
    const opts = this.refOptions()[field.key] ?? [];
    return ids.map(id => {
      const opt = opts.find(o => o.id === id);
      return opt ? String(opt[mr.refLabelKey ?? 'nombre']) : String(id);
    });
  }

  fmtCell(row: any, field: FieldDef) {
    if (field.type === 'ref' || field.type === 'checkbox-single') {
      const nested = field.refResponseKey ? row[field.refResponseKey] : null;
      if (nested) return nested[field.refLabelKey ?? 'nombre'] ?? '—';
      return this.refLabel(field, row[field.key]);
    }
    if (field.type === 'multiref') {
      const labels = this.multiRefLabels(row, field);
      return labels.length ? labels.join(', ') : '—';
    }
    if (field.type === 'ownedlist') {
      const labels = this.ownedListData()[field.key]?.[row.id] ?? [];
      return labels.length ? labels.join(', ') : '—';
    }
    const v = row[field.key];
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'object') return JSON.stringify(v).slice(0, 40);
    return String(v);
  }

  deleteRow(row: any) {
    const d = this.def(); if (!d) return;
    if (!confirm(`¿Eliminar el registro #${row.id}?`)) return;
    this.api.delete<any>(`${d.path}/${row.id}`).subscribe({
      next: () => this.items.update(a => a.filter(x => x.id !== row.id)),
      error: e => this.error.set(this.msg(e))
    });
  }

  private msg(e: any): string {
    const s = e.status ?? '';
    const m = e.error?.message ?? e.error?.detail ?? e.message ?? 'Error';
    return `${s} ${m}`.trim();
  }
}
