import { Component, ChangeDetectorRef } from "@angular/core";
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: "app-path",
    imports: [ReactiveFormsModule],
    templateUrl: "./path.html",
    styleUrl: "./path.css"
})
export class Path {
    form!: FormGroup;
    isTripDropdownOpen = false;

    locationOptions = [
        { id: 1, name: 'walk' },
        { id: 2, name: 'car' }
    ];

    // Mock data for the Trip checkboxes
    tripOptions = [
        { id: 'T1', name: 'bus' },
        { id: 'T2', name: 'rail' }
    ];

    constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef) {}

    ngOnInit(): void {
        this.form = this.fb.group({
        startLatitude: ['', [Validators.required, Validators.pattern(/^-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,15}$/)]],
        startLongitude: ['', [Validators.required, Validators.pattern(/^-?((1[0-7]|[1-9])?\d|[1-9]0)\.{1}\d{1,15}$/)]],
        // Arrive Point
        arriveLatitude: ['', [Validators.required, Validators.pattern(/^-?((1[0-7]|[1-9])?\d|[1-9]0)\.{1}\d{1,15}$/)]],
        arriveLongitude: ['', [Validators.required, Validators.pattern(/^-?((1[0-7]|[1-9])?\d|[1-9]0)\.{1}\d{1,15}$/)]],
        access: [''],
        egress: [''],
        direct: [''],
        trips: this.fb.array([], Validators.required) // FormArray for checkboxes
        });

        this.addTripCheckboxes();
    }

    private addTripCheckboxes() {
        this.tripOptions.forEach(() => {
            this.tripsFormArray.push(this.fb.control(false));
        });
    }
    get tripsFormArray() {
        return this.form.get('trips') as FormArray;
    }

    get selectedTripsCount() {
        return this.tripsFormArray.controls.filter(c => c.value).length;
    }

    toggleTripDropdown() {
        this.isTripDropdownOpen = !this.isTripDropdownOpen;
    }

    onSubmit() {
        if (this.form.valid) {
            console.log('Searching paths for:', this.form.value);
            // Logic to show results in the bottom part goes here
        }
    }

    public updateFormFromMap(data: {start?: L.LatLng, arrive?: L.LatLng}) {
        this.form.patchValue({
            startLatitude: data.start?.lat.toFixed(6) || '',
            startLongitude: data.start?.lng.toFixed(6) || '',
            arriveLatitude: data.arrive?.lat.toFixed(6) || '',
            arriveLongitude: data.arrive?.lng.toFixed(6) || ''
        }, { emitEvent: false }); // emitEvent: false prevents infinite loops
        console.log(this.form.patchValue);
    }

    // Logic for the drag start event
    onDragStart(event: DragEvent, type: string) {
        event.dataTransfer?.setData('markerType', type);
    }
}
