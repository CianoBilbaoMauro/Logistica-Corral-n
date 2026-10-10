import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PedidosService } from '../services/pedidos';
import { Zona, Pedido } from '../models/logistica.model';
import { FRANJAS } from '../models/estados';
import { mensajeError } from '../utils/errores';

function fechaLocalHoy(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// 8 a 15 dígitos, ignorando espacios, guiones y paréntesis
function telefonoValido(c: AbstractControl): ValidationErrors | null {
  const digitos = String(c.value ?? '').replace(/\D/g, '');
  return digitos.length >= 8 && digitos.length <= 15 ? null : { telefono: true };
}

@Component({
  selector: 'app-new-order',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './new-order.component.html',
  styleUrl: './new-order.component.css'
})
export class NewOrderComponent implements OnInit {
  private service = inject(PedidosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  readonly hoy = fechaLocalHoy();
  readonly franjas = FRANJAS;

  // Signals: la pantalla se actualiza sola cuando responde el servidor
  zonas = signal<Zona[]>([]);
  guardando = signal(false);
  cargandoPedido = signal(false);
  error = signal<string | null>(null);

  pedidoId: string | null = null;
  isDarkMode = false;

  form = this.fb.nonNullable.group({
    zonaId: ['', Validators.required],
    clienteNombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    clienteTelefono: ['', [Validators.required, telefonoValido]],
    direccion: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    // Solo marca error si la fecha pasada la eligió el usuario (al editar no molesta)
    fechaProgramada: ['', [Validators.required, (c: AbstractControl): ValidationErrors | null =>
      c.dirty && c.value && c.value < this.hoy ? { pasada: true } : null]],
    franjaHoraria: ['', Validators.required],
    camioneroNombre: ['', Validators.maxLength(100)],
    observacionEntrega: ['', Validators.maxLength(500)],
  });

  get modoEdicion(): boolean { return !!this.pedidoId; }

  ngOnInit(): void {
    this.isDarkMode = document.body.classList.contains('dark-theme');

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
      next: () => this.router.navigate(['/home']),
      error: (err) => {
        this.guardando.set(false);
        this.error.set(mensajeError(err, 'No se pudo guardar el pedido.'));
      },
    });
  }

  cancelar(): void { this.router.navigate(['/home']); }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-theme', this.isDarkMode);
  }

  // Mensaje de error de un campo (solo si fue tocado)
  msg(campo: string): string {
    const c = this.form.get(campo);
    if (!c || !c.touched || !c.errors) return '';
    if (c.errors['required']) return 'Este campo es obligatorio';
    if (c.errors['minlength']) return 'Es demasiado corto';
    if (c.errors['maxlength']) return 'Es demasiado largo';
    if (c.errors['telefono']) return 'Ingresá un teléfono válido (entre 8 y 15 dígitos)';
    if (c.errors['pasada']) return 'La fecha no puede ser anterior a hoy';
    return 'Valor inválido';
  }
}