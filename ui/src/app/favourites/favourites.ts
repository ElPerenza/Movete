import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink, Router } from "@angular/router";
import { UserService } from "../user/services/user.service";
import { Stop } from "../class/stop";
import { forkJoin } from "rxjs";

@Component({
    selector: "app-favourites",
    imports: [CommonModule, RouterLink],
    templateUrl: "./favourites.html"
})
export class Favourites implements OnInit {
    public favouriteStops: Stop[] = [];
    public favouriteParks: any[] = [];
    public isLoading = true;

    constructor(private userService: UserService, private cdr: ChangeDetectorRef, private router: Router) { }

    ngOnInit() {
        this.loadFavourites();
    }

    loadFavourites() {
        forkJoin({
            stops: this.userService.getFavourites(),
            parks: this.userService.getFavouriteParks()
        }).subscribe({
            next: ({ stops, parks }) => {
                this.favouriteStops = stops;
                this.favouriteParks = parks;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error("Errore nel caricamento dei preferiti:", err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    removeFavourite(stop: any) {

        const stopId = stop.id || stop._id;

        this.userService.removeFavourite(stopId).subscribe(() => {
            this.favouriteStops = this.favouriteStops.filter(s => s.id !== stopId);
            this.cdr.detectChanges();
        });
    }

    removeFavouritePark(park: any) {
        const parkId = park.id || park._id;
        this.userService.removeFavouritePark(parkId).subscribe(() => {
            this.favouriteParks = this.favouriteParks.filter(p => (p.id || p._id) !== parkId);
            this.cdr.detectChanges();
        });
    }

    goToMap(stop: any) {
        const stopId = stop.id || stop._id;
        // Naviga verso la rotta base (la mappa) passando l'ID come parametro
        this.router.navigate(['/'], { queryParams: { stop: stopId } });
    }

    goToMapPark(park: any) {
        const parkId = park.id || park._id;
        this.router.navigate(['/'], { queryParams: { park: parkId } });
    }
}
