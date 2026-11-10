import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { mockApiInterceptor } from './mock/mock-api.interceptor';

registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    // No modo mock (pnpm dev:mock) as chamadas /api são respondidas em memória.
    provideHttpClient(withFetch(), withInterceptors(environment.mock ? [mockApiInterceptor] : [])),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
  ],
};
