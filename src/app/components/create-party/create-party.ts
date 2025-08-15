import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Party } from '../../models/fiesta';
import { PartyService } from '../../services/party';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-create-party',
  standalone: true,
  imports: [FormsModule, NgOptimizedImage],
  templateUrl: './create-party.html',
  styleUrls: ['./create-party.css']
})
export class CreatePartyComponent {

  party: Party = {
    name: '',
    place: '',
    date: '',
    startTime: '',
    endTime: '',
    ticketsAvailable: true,
    dressCode: '',
    musicType: '',
    photo: ''
  };

  selectedFile: File | null = null;

  // Configuración de Cloudinary
  cloudName = 'dp18ba4tj';
  unsignedUploadPreset = 'cookshare_unsigned';

  constructor(
    private partyService: PartyService,
    private router: Router,
    private http: HttpClient
  ) {}

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      console.log('Archivo seleccionado:', this.selectedFile);
    }
  }

  async onSubmit(): Promise<void> {
    try {
      // Subir imagen a Cloudinary si hay archivo seleccionado
      if (this.selectedFile) {
        this.party.photo = await this.uploadToCloudinary(this.selectedFile);
      }

      // Evitar enviar datos sin foto
      if (!this.party.photo) {
        throw new Error('La foto no se subió correctamente.');
      }

      // Guardar en Firebase
      await this.partyService.createParty(this.party);

      // Redirigir
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Error al crear fiesta:', error);
    }
  }

  // Función para subir archivo a Cloudinary
  uploadToCloudinary(file: File): Promise<string> {
    const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.unsignedUploadPreset);

    return new Promise((resolve, reject) => {
      this.http.post<any>(url, formData).subscribe({
        next: response => {
          if (response.secure_url) {
            resolve(response.secure_url);
          } else {
            reject('No se recibió URL de Cloudinary.');
          }
        },
        error: err => reject('Error al subir imagen: ' + err.message)
      });
    });
  }
}
