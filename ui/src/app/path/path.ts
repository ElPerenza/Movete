import { Component, ChangeDetectorRef } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: "app-path",
    imports: [ReactiveFormsModule],
    templateUrl: "./path.html",
    styleUrl: "./path.css"
})
export class Path {
    form!: FormGroup;
    
    private baseUrl: string = 'http://localhost:3000/path'
    private header: HttpHeaders = new HttpHeaders({ 'Content-Type' : 'application/json' });

    isTripDropdownOpen = false;

    locationOptions = [
        { id: 'walk', name: 'walk' },
        { id: 'car', name: 'car' }
    ];

    // Mock data for the Trip checkboxes
    tripOptions = [
        { id: 'bus', name: 'bus' },
        { id: 'rail', name: 'rail' }
    ];

    constructor(private http: HttpClient, private fb: FormBuilder, private cdr: ChangeDetectorRef) {}

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
            const raw = this.form.getRawValue();
            const selectedTransportModes = raw.trips
                .map((checked: boolean, index: number) => checked ? this.tripOptions[index].id : null)
                .filter((mode: string | null) => mode !== null);
            const payload = {
                from: {
                    latitude: parseFloat(raw.startLatitude),
                    longitude: parseFloat(raw.startLongitude)
                },
                to: {
                    latitude: parseFloat(raw.arriveLatitude),
                    longitude: parseFloat(raw.arriveLongitude)
                },
                dateTime: new Date().toISOString(),
                modes: {
                    accessMode: raw.access || undefined,
                    egressMode: raw.egress || undefined,
                    directMode: raw.direct || undefined,
                    transportModes: selectedTransportModes
                },
                arriveBy: false
            }

            this.http.post(this.baseUrl, payload, { headers: this.header }).subscribe({
                next: (response) => {
                console.log('Path found:', response);
                // Here you would likely call a service to draw the path on the map
                },
                error: (err) => console.error('Error calculating path', err)
            });
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
