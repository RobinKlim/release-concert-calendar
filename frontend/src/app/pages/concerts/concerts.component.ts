import { Component } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { PageContainer } from '../../components/page-container/page-container';

@Component({
  selector: 'app-concerts',
  standalone: true,
  imports: [HeaderComponent, PageContainer],
  templateUrl: './concerts.component.html'
})
export class ConcertsComponent {}
