import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { ConfirmationService, MessageService } from 'primeng/api';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';

// Marca de Motor de Promociones: primario coral-rosa en vez del emerald por defecto de Aura.
// Los severity semánticos (success/danger/warn) no se tocan — siguen significando estado, no marca.
const GRADIENTE_MARCA = 'linear-gradient(90deg, {orange.400} 0%, {pink.500} 65%)';
const GRADIENTE_MARCA_HOVER = 'linear-gradient(90deg, {orange.500} 0%, {pink.600} 65%)';

const MotorPromocionesPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{pink.50}',
      100: '{pink.100}',
      200: '{pink.200}',
      300: '{pink.300}',
      400: '{pink.400}',
      500: '{pink.500}',
      600: '{pink.600}',
      700: '{pink.700}',
      800: '{pink.800}',
      900: '{pink.900}',
      950: '{pink.950}',
    },
  },
  components: {
    tag: {
      root: {
        fontWeight: '400',
      },
    },
    button: {
      colorScheme: {
        light: {
          root: {
            primary: {
              background: GRADIENTE_MARCA,
              hoverBackground: GRADIENTE_MARCA_HOVER,
              activeBackground: GRADIENTE_MARCA_HOVER,
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
              color: '#ffffff',
              hoverColor: '#ffffff',
              activeColor: '#ffffff',
            },
          },
          outlined: {
            primary: {
              hoverBackground: '{orange.50}',
              activeBackground: '{orange.100}',
              borderColor: '{orange.300}',
              color: '{orange.600}',
            },
          },
        },
        dark: {
          root: {
            primary: {
              background: GRADIENTE_MARCA,
              hoverBackground: GRADIENTE_MARCA_HOVER,
              activeBackground: GRADIENTE_MARCA_HOVER,
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
              color: '#ffffff',
              hoverColor: '#ffffff',
              activeColor: '#ffffff',
            },
          },
          outlined: {
            primary: {
              hoverBackground: '{orange.950}',
              activeBackground: '{orange.900}',
              borderColor: '{orange.700}',
              color: '{orange.400}',
            },
          },
        },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: MotorPromocionesPreset,
        options: {
          darkModeSelector: '.app-dark',
        },
      },
    }),
    ConfirmationService,
    MessageService,
  ]
};
