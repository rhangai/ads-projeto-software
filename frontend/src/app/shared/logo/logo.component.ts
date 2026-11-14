import { Component } from '@angular/core';

let proximoId = 0;

/**
 * Marca do Cão Saci: beagle sênior com a rodinha da cadeira.
 * Fonte original: docs/logo/cao-saci-logo.svg (mantenha os dois iguais).
 * Decorativa: o nome "Cão Saci" sempre aparece em texto ao lado.
 */
@Component({
  selector: 'app-logo',
  standalone: true,
  host: { class: 'contents' },
  template: `
    <svg class="h-12 w-12 shrink-0" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <!-- id único por instância: o logo aparece duas vezes (cabeçalho e menu lateral). -->
        <clipPath [attr.id]="idSelo"><circle cx="60" cy="60" r="54" /></clipPath>
      </defs>
      <circle cx="60" cy="60" r="54" fill="#E3F1E6" />
      <g [attr.clip-path]="'url(#' + idSelo + ')'">
        <path d="M30 124 C32 100 44 88 60 88 C76 88 88 100 90 124 Z" fill="#FFFFFF" />
        <path d="M72 91 C84 95 92 106 94 124 L82 124 C81 109 78 99 72 91 Z" fill="#2A2522" />
        <path d="M43 36 C30 36 23 49 24 66 C25 79 32 86 39 81 C43 70 46 52 43 36 Z" fill="#9A5A28" />
        <path d="M77 36 C90 36 97 49 96 66 C95 79 88 86 81 81 C77 70 74 52 77 36 Z" fill="#9A5A28" />
        <ellipse cx="60" cy="56" rx="23" ry="26" fill="#C98A4B" />
        <path d="M54 31 C57 28.5 63 28.5 66 31 L67.5 49 C76 53 81 63 78.5 72 C76 81.5 67.5 85.5 60 85.5 C52.5 85.5 44 81.5 41.5 72 C39 63 44 53 52.5 49 Z" fill="#FFFFFF" />
        <circle cx="50" cy="53" r="3.8" fill="#3B2314" />
        <circle cx="70" cy="53" r="3.8" fill="#3B2314" />
        <circle cx="51.2" cy="51.8" r="1.2" fill="#FFFFFF" />
        <circle cx="71.2" cy="51.8" r="1.2" fill="#FFFFFF" />
        <ellipse cx="60" cy="68" rx="6.2" ry="4.6" fill="#1C1917" />
        <ellipse cx="58" cy="66.4" rx="1.8" ry="1" fill="#57534E" />
        <path d="M60 72.6 V75.6 M60 75.6 C57.5 78.4 54.5 77.6 53.4 75.4 M60 75.6 C62.5 78.4 65.5 77.6 66.6 75.4" fill="none" stroke="#1C1917" stroke-width="1.8" stroke-linecap="round" />
      </g>
      <circle cx="60" cy="60" r="54" fill="none" stroke="#14532D" stroke-width="6" />
      <circle cx="94" cy="96" r="16" fill="#FFFFFF" stroke="#14532D" stroke-width="5" />
      <path d="M94 83 V109 M81 96 H107 M84.8 86.8 L103.2 105.2 M103.2 86.8 L84.8 105.2" stroke="#14532D" stroke-width="2.4" stroke-linecap="round" />
      <circle cx="94" cy="96" r="4.2" fill="#14532D" />
    </svg>
  `,
})
export class LogoComponent {
  readonly idSelo = `logo-selo-${proximoId++}`;
}
