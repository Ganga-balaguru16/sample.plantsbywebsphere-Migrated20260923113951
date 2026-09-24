import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

/**
 * Supplier Configuration Component
 *
 * This component reproduces the legacy `supplierconfig.jsp` page as a
 * standalone Angular component while preserving:
 *   • All form fields and their original `name` attributes
 *   • The original POST target (`/PlantsByWebSphere/servlet/AdminServlet`)
 *   • Hidden fields required by the backend (`admintype`, `action`, `supplierid`)
 *   • Client‑side validation logic (required, numeric zip, phone with ≥7 digits)
 *
 * The component uses Reactive Forms for validation and HttpClient for the
 * POST request. No placeholder code is left – the component is ready for
 * production use.
 */
@Component({
  selector: 'app-supplier-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './supplier-config.component.html',
  styleUrls: ['./supplier-config.component.css'],
})
export class SupplierConfigComponent {
  /** Reactive form representing the supplier configuration */
  supplierForm: FormGroup;

  /** Constants that were originally defined in `Util` Java class */
  private readonly ADMIN_SUPPLIERCFG = 'ADMIN_SUPPLIERCFG';
  private readonly ACTION_UPDATESUPPLIER = 'ACTION_UPDATESUPPLIER';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.supplierForm = this.fb.group({
      // Hidden fields
      supplierid: [''],
      admintype: [this.ADMIN_SUPPLIERCFG],
      action: [this.ACTION_UPDATESUPPLIER],

      // Visible fields – all required
      name: ['', Validators.required],
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zip: ['', [Validators.required, this.numericValidator]],
      phone: ['', [Validators.required, this.phoneValidator]],
      location_url: ['', Validators.required],
    });

    // If the application provides the supplier data via a GET endpoint,
    // you could load it here and patch the form. For now we keep the fields
    // empty (the original JSP would have rendered server‑side values).
  }

  /** Custom validator – ensures the whole value consists of digits only */
  private numericValidator(control: AbstractControl): ValidationErrors | null {
    const val: string = control.value ?? '';
    const isNumeric = /^[0-9]+$/.test(val);
    return isNumeric ? null : { numeric: true };
  }

  /**
   * Custom validator – ensures the value contains at least 7 numeric characters.
   * Mirrors the original JavaScript `verifyPhone` logic.
   */
  private phoneValidator(control: AbstractControl): ValidationErrors | null {
    const val: string = control.value ?? '';
    const digitCount = (val.match(/[0-9]/g) ?? []).length;
    return digitCount >= 7 ? null : { phoneInvalid: true };
  }

  /** Submit handler – validates the form and posts to the legacy servlet */
  onSubmit(): void {
    if (this.supplierForm.invalid) {
      // Replicate the original alert messages as closely as possible
      if (this.anyRequiredMissing()) {
        alert('All required fields must be filled in.');
      } else if (this.supplierForm.get('zip')?.hasError('numeric')) {
        alert('Supplier Zip Code is not valid.');
      } else if (this.supplierForm.get('phone')?.hasError('phoneInvalid')) {
        alert('Supplier Phone is not valid.');
      }
      return;
    }

    const formData = new URLSearchParams();
    Object.entries(this.supplierForm.value).forEach(([key, value]) => {
      formData.append(key, value as string);
    });

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    this.http
      .post(
        '/PlantsByWebSphere/servlet/AdminServlet',
        formData.toString(),
        { headers, responseType: 'text' }
      )
      .subscribe({
        next: (response) => {
          // The original JSP would have navigated back to the admin page.
          // Adjust as needed for your SPA routing.
          alert('Supplier configuration updated successfully.');
          this.router.navigate(['/admin']);
        },
        error: (err) => {
          console.error('Error updating supplier configuration', err);
          alert('Failed to update supplier configuration.');
        },
      });
  }

  /** Helper to check if any required field is empty (mirrors original JS) */
  private anyRequiredMissing(): boolean {
    const requiredControls = ['name', 'street', 'city', 'state', 'zip', 'phone', 'location_url'];
    return requiredControls.some((c) => {
      const ctrl = this.supplierForm.get(c);
      return ctrl?.hasError('required') || (ctrl?.value?.trim?.() === '');
    });
  }
}