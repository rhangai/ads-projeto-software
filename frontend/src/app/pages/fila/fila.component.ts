import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, mensagemDeErro } from '../../core/api.service';
import { Cao } from '../../core/models';
import { LogoComponent } from '../../shared/logo/logo.component';
import { StatusTagComponent } from '../../shared/status-tag/status-tag.component';

@Component({
  selector: 'app-fila',
  standalone: true,
  imports: [RouterLink, StatusTagComponent, LogoComponent],
  templateUrl: './fila.component.html',
})
export class FilaComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly caes = signal<Cao[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);

  /** "(11) 90000-0001" -> "tel:11900000001" */
  linkTelefone(telefone: string): string {
    return 'tel:' + telefone.replace(/\D/g, '');
  }

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api.listarCaes().subscribe({
      next: (caes) => {
        this.caes.set(caes);
        this.carregando.set(false);
      },
      error: (err) => {
        this.erro.set(mensagemDeErro(err));
        this.carregando.set(false);
      },
    });
  }
}
