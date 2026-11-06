import { Component } from '@angular/core';

/** Marca do Cão Saci: pata branca-esverdeada em círculo. Decorativa. */
@Component({
  selector: 'app-logo',
  standalone: true,
  host: { class: 'contents' },
  template: `
    <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-green-900 ring-2 ring-green-900" aria-hidden="true">
      <svg class="h-8 w-8" viewBox="0 0 32 32" fill="currentColor">
        <ellipse cx="9" cy="12" rx="2.8" ry="3.6" />
        <ellipse cx="14" cy="7.5" rx="2.8" ry="3.6" />
        <ellipse cx="20" cy="7.5" rx="2.8" ry="3.6" />
        <ellipse cx="25" cy="12" rx="2.8" ry="3.6" />
        <path d="M17 14c-4 0-8.5 5.2-8.5 9 0 2.6 2 4 4.4 4 1.7 0 2.6-.8 4.1-.8s2.4.8 4.1.8c2.4 0 4.4-1.4 4.4-4 0-3.8-4.5-9-8.5-9Z" />
      </svg>
    </span>
  `,
})
export class LogoComponent {}
