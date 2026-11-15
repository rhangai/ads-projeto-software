import { Component, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, mensagemDeErro } from '../../core/api.service';
import { NovoCao } from '../../core/models';
import { ToastService } from '../../core/toast.service';

/**
 * Mesma regra da API: só dígitos e pontuação de telefone, com 10 a 13 dígitos
 * (DDD + número, com ou sem +55). Conta dígitos, não caracteres.
 */
export function telefoneComDdd(controle: AbstractControl<string>): ValidationErrors | null {
  const v = controle.value ?? '';
  if (!v) return null; // "required" cuida do vazio
  const digitos = v.replace(/\D/g, '').length;
  return /^[0-9()+\-.\s]+$/.test(v) && digitos >= 10 && digitos <= 13 ? null : { telefone: true };
}

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

  // Mesmos limites da API (backend/src/controllers/caes.controller.ts): a API é quem garante,
  // o formulário só avisa antes de enviar.
  readonly form = this.fb.group({
    nome_cao: ['', [Validators.required, Validators.maxLength(60)]],
    nome_tutor: ['', [Validators.required, Validators.maxLength(60)]],
    telefone_tutor: ['', [Validators.required, Validators.maxLength(20), telefoneComDdd]],
    // Começam vazios (null) para não exibir um "0" que confunde quem está preenchendo.
    altura_cm: this.fb.control<number | null>(null, [Validators.required, Validators.min(5), Validators.max(150)]),
    comprimento_cm: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(10),
      Validators.max(200),
    ]),
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
    // Os validadores "required" garantem que as medidas não são null aqui.
    this.api.cadastrarCao(this.form.getRawValue() as NovoCao).subscribe({
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
