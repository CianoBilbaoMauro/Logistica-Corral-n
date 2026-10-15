import { Component } from '@angular/core';

@Component({
  selector: 'app-barra-superior',
  standalone: true,
  template: `
    <header class="navbar">
      <div class="navbar-brand">
        <span>Gabarain Materiales</span>
        <span class="sub-text">| Logística</span>
      </div>
    </header>
  `,
  styles: `
    :host { display: block; flex-shrink: 0; position: relative; z-index: 2; }

    .navbar {
      background-color: var(--color-primary);
      color: var(--color-navbar-text);
      padding: .9rem 2rem;
      box-shadow: var(--shadow-navbar);
    }
    .navbar-brand {
      display: flex; align-items: center; gap: .5rem;
      font-size: 1.3rem; font-weight: 800; letter-spacing: .3px;
    }
    .sub-text { font-weight: 400; font-size: 1rem; opacity: .9; }

    @media (max-width: 600px) {
      .navbar { padding: .8rem 1rem; }
      .navbar-brand { font-size: 1.1rem; }
      .sub-text { font-size: .85rem; }
    }
  `,
})
export class BarraSuperiorComponent {}