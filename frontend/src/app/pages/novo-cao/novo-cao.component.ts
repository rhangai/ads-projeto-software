import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, mensagemDeErro } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-novo-cao',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './novo-cao.component.html',
})
export class NovoCaoComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly enviando = signal(false);

  readonly form = this.fb.group({
    nome_cao: ['', [Validators.required]],
    nome_tutor: ['', [Validators.required]],
    telefone_tutor: ['', [Validators.required, Validators.minLength(8)]],
    altura_cm: [0, [Validators.required, Validators.min(5), Validators.max(150)]],
    comprimento_cm: [0, [Validators.required, Validators.min(10), Validators.max(200)]],
  });

  invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.erro('Confira os campos destacados antes de salvar.');
      return;
    }
    this.enviando.set(true);
    this.api.cadastrarCao(this.form.getRawValue()).subscribe({
      next: (cao) => {
        this.toast.sucesso(`${cao.nome_cao} entrou na fila de espera.`);
        this.router.navigateByUrl('/fila');
      },
      error: (err) => {
        this.toast.erro(mensagemDeErro(err));
        this.enviando.set(false);
      },
    });
  }
}
