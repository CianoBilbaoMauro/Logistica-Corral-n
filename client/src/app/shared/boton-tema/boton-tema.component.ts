import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-boton-tema',
  standalone: true,
  template: `
    <button type="button" class="btn-tema" (click)="tema.alternar()" aria-label="Cambiar tema" title="Cambiar tema">
      <svg class="ico"><use [attr.href]="tema.oscuro() ? '#i-sun' : '#i-moon'" /></svg>
    </button>
  `,
  styles: `
    .btn-tema {
      position: fixed; bottom: 55px; right: 35px; width: 52px; height: 52px;
      display: flex; align-items: center; justify-content: center;
      background-color: var(--color-primary); border: none; border-radius: 50%; cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, .3); z-index: 100;
      transition: background-color .2s ease, transform .2s ease;
    }
    .btn-tema:hover { background-color: var(--color-primary-hover); transform: scale(1.08); }
    .btn-tema .ico { width: 22px; height: 22px; color: #fff; }

    @media (max-width: 600px) {
      .btn-tema { bottom: 60px; right: 18px; width: 48px; height: 48px; }
    }
    @media print { :host { display: none; } }
  `,
})
export class BotonTemaComponent {
  protected readonly tema = inject(ThemeService);
}