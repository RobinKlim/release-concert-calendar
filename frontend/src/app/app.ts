import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UpdateToastComponent } from './components/update-toast/update-toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UpdateToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
