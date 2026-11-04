import { Component, computed, input } from '@angular/core';
import { StatusCao } from '../../core/models';

const ESTILOS: Record<StatusCao, { rotulo: string; classes: string; icone: string }> = {
  aguardando: {
    rotulo: 'Aguardando',
    classes: 'bg-amber-100 text-amber-950 border-amber-700',
    icone: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
  em_montagem: {
    rotulo: 'Em montagem',
    classes: 'bg-sky-100 text-sky-950 border-sky-700',
    icone: 'M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085',
  },
  entregue: {
    rotulo: 'Entregue',
    classes: 'bg-green-100 text-green-950 border-green-700',
    icone: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
};

/** Etiqueta de status: ícone + texto + borda (não depende só da cor). */
@Component({
  selector: 'app-status-tag',
  standalone: true,
  template: `
    <span
      class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 px-3 py-1 text-base font-bold"
      [class]="estilo().classes"
    >
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="estilo().icone" />
      </svg>
      {{ estilo().rotulo }}
    </span>
  `,
})
export class StatusTagComponent {
  readonly status = input.required<StatusCao>();
  readonly estilo = computed(() => ESTILOS[this.status()]);
}
