import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { BarraSuperiorComponent } from '../shared/barra-superior/barra-superior.component';
import { BotonTemaComponent } from '../shared/boton-tema/boton-tema.component';
import { PiePaginaComponent } from '../shared/pie-pagina/pie-pagina.component';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    BarraSuperiorComponent,
    BotonTemaComponent,
    PiePaginaComponent
  ],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent {
  private router = inject(Router);

  isDarkMode = false;

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;

    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  irAGestion(): void {
    this.router.navigate(['/home']);
  }
}