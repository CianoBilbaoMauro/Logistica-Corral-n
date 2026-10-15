import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PedidosService } from '../services/pedidos';
import { ToastService } from '../services/toast.service';
import { Zona, Pedido } from '../models/logistica.model';
import { FRANJAS } from '../models/estados';
import { CONDICIONES_PAGO, EMISORES, TIPOS_COMPROBANTE } from '../models/facturacion';
import { fechaLocal } from '../utils/fechas';
import { esUbicacionValida } from '../utils/mapas';
import { mensajeError } from '../utils/errores';
import { BarraSuperiorComponent } from '../shared/barra-superior/barra-superior.component';
import { BotonTemaComponent } from '../shared/boton-tema/boton-tema.component';
import { PiePaginaComponent } from '../shared/pie-pagina/pie-pagina.component';

// 8 a 15 dígitos, ignorando espacios, guiones y paréntesis
function telefonoValido(c: AbstractControl): ValidationErrors | null {
  const digitos = String(c.value ?? '').replace(/\D/g, '');
  return digitos.length >= 8 && digitos.length <= 15 ? null : { telefono: true };
}

// Opcional: si se completa, tiene que ser un enlace de Google Maps o coordenadas
function ubicacionValida(c: AbstractControl): ValidationErrors | null {
  const valor = String(c.value ?? '').trim();
  return !valor || esUbicacionValida(valor) ? null : { ubicacion: true };
}

@Component({
  selector: 'app-new-order',
  standalone: true,
  imports: [ReactiveFormsModule, BarraSuperiorComponent, BotonTemaComponent, PiePaginaComponent],
  templateUrl: './new-order.component.html',
  styleUrl: './new-order.component.css'
})
export class NewOrderComponent implements OnInit {
  private service = inject(PedidosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  readonly hoy = fechaLocal();
  readonly franjas = FRANJAS;
  readonly tiposComprobante = TIPOS_COMPROBANTE;
  readonly condicionesPago = CONDICIONES_PAGO;
  readonly emisores = EMISORES;

  // Signals: la pantalla se actualiza sola cuando responde el servidor
  zonas = signal<Zona[]>([]);
  guardando = signal(false);
  cargandoPedido = signal(false);
  error = signal<string | null>(null);

  pedidoId: string | null = null;

  form = this.fb.nonNullable.group({
    zonaId: ['', Validators.required],
    clienteNombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    clienteTelefono: ['', [Validators.required, telefonoValido]],
    direccion: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    ubicacionUrl: ['', [Validators.maxLength(300), ubicacionValida]],
    // Facturación (todo opcional)
    tipoComprobante: [''],
    condicionPago: [''],
    emisor: [''],
    nroFactura: ['', [Validators.maxLength(30), Validators.pattern(/^[A-Za-z0-9\-/ ]*$/)]],
    // Solo marca error si la fecha pasada la eligió el usuario (al editar no molesta)
    fechaProgramada: ['', [Validators.required, (c: AbstractControl): ValidationErrors | null =>
      c.dirty && c.value && c.value < this.hoy ? { pasada: true } : null]],
    franjaHoraria: ['', Validators.required],
    camioneroNombre: ['', Validators.maxLength(100)],
    observacionEntrega: ['', Validators.maxLength(500)],
  });

  get modoEdicion(): boolean { return !!this.pedidoId; }

  ngOnInit(): void {
    this.service.getZonas().subscribe({
      next: (zonas) => this.zonas.set(zonas),
      error: (err) => this.error.set(mensajeError(err, 'No se pudieron cargar las zonas.')),
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.pedidoId = id;
      this.cargarPedido(id);
    }
  }

  private cargarPedido(id: string): void {
    this.cargandoPedido.set(true);
    this.service.getPedidoPorId(id).subscribe({
      next: (p) => {
        this.form.patchValue({
          zonaId: p.zonaId ?? '',
          clienteNombre: p.clienteNombre ?? '',
          clienteTelefono: p.clienteTelefono ?? '',
          direccion: p.direccion ?? '',
          ubicacionUrl: p.ubicacionUrl ?? '',
          tipoComprobante: p.tipoComprobante ?? '',
          condicionPago: p.condicionPago ?? '',
          emisor: p.emisor ?? '',
          nroFactura: p.nroFactura ?? '',
          fechaProgramada: p.fechaProgramada ?? '',
          franjaHoraria: p.franjaHoraria ?? '',
          camioneroNombre: p.camioneroNombre ?? '',
          observacionEntrega: p.observacionEntrega ?? '',
        });
        this.cargandoPedido.set(false);
      },
      error: (err) => {
        this.cargandoPedido.set(false);
        this.error.set(mensajeError(err, 'No se pudo cargar el pedido.'));
      },
    });
  }

  guardar(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const datos = this.form.getRawValue() as Partial<Pedido>;

    const peticion = this.modoEdicion && this.pedidoId
      ? this.service.actualizarPedido(this.pedidoId, datos)
      : this.service.crearPedido(datos);

    peticion.subscribe({
      next: () => {
        this.toast.exito(this.modoEdicion ? 'Pedido actualizado.' : 'Pedido creado.');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(mensajeError(err, 'No se pudo guardar el pedido.'));
      },
    });
  }

  cancelar(): void { this.router.navigate(['/home']); }

  // Mensaje de error de un campo (solo si fue tocado)
  msg(campo: string): string {
    const c = this.form.get(campo);
    if (!c || !c.touched || !c.errors) return '';
    if (c.errors['required']) return 'Este campo es obligatorio';
    if (c.errors['minlength']) return 'Es demasiado corto';
    if (c.errors['maxlength']) return 'Es demasiado largo';
    if (c.errors['telefono']) return 'Ingresá un teléfono válido (entre 8 y 15 dígitos)';
    if (c.errors['pasada']) return 'La fecha no puede ser anterior a hoy';
    if (c.errors['ubicacion']) return 'Pegá un enlace de Google Maps o coordenadas (ej: -38.27, -57.84)';
    if (c.errors['pattern']) return 'Solo letras, números y guiones (ej: 0001-00001234)';
    return 'Valor inválido';
  }
}