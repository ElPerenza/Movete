import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { UserService } from "../user/services/user.service";
import { Stop } from "../class/stop";

@Component({
    selector: "app-favourites",
    imports: [CommonModule, RouterLink],
    templateUrl: "./favourites.html"
})
export class Favourites implements OnInit {
    public favouriteStops: Stop[] = [];
    public isLoading = true;

    constructor(private userService: UserService, private cdr: ChangeDetectorRef) { }

    ngOnInit() {
        this.loadFavourites();
    }

    loadFavourites() {
        this.userService.getFavourites().subscribe({
            next: stops => {
                this.favouriteStops = stops;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.isLoading = false;
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
}
