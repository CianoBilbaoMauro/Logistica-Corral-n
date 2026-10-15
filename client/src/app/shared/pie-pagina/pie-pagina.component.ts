import { Component, input } from '@angular/core';

@Component({
  selector: 'app-pie-pagina',
  standalone: true,
  template: `
    <footer class="footer" [class.izquierda]="alineacion() === 'izquierda'">
      © {{ anio }} - Developed by Ciano Bilbao Mauro
    </footer>
  `,
  styles: `
    :host { display: block; margin-top: auto; flex-shrink: 0; position: relative; z-index: 2; }

    .footer {
      background-color: var(--color-primary);
      color: var(--color-navbar-text);
      text-align: center;
      padding: .9rem 1rem;
      font-size: .85rem;
      font-weight: 500;
      letter-spacing: .5px;
    }
    .footer.izquierda { text-align: left; padding: .9rem 2rem; }

    @media (max-width: 600px) {
      .footer.izquierda { padding: .9rem 1rem; }
    }
  `,
})
export class PiePaginaComponent {
  // 'centro' (formulario y camionero) o 'izquierda' (bienvenida y panel)
  readonly alineacion = input<'izquierda' | 'centro'>('centro');
  readonly anio = new Date().getFullYear();
}