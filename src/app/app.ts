import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaStatus } from './pwa-status';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PwaStatus],
  styleUrl: './app.scss',
  template: `
    <app-pwa-status />
    <router-outlet />
  `,
})
export class App {}
