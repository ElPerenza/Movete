import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { Map } from "./map/map";
import { AuthService } from "./auth/services/auth.service";

@Component({
    selector: "app-root",
    imports: [RouterOutlet, Map],
    templateUrl: "./app.html",
    styleUrl: "./app.css"
})
export class App {
    protected readonly title = "Movete";

    constructor(private authService: AuthService) { console.log("App component built"); }

    ngOnInit() {
        /**
         * To check session globally
         *If not wanted here move to map ngOnInit
         * (ma considerando futura implementazione di interfaccia per
         * dipendente provinciale, lascierei qui)
        */

        this.authService.checkInitialSession().subscribe({
            next: (res) => console.log("response from /me recieved:", res),
            error: (err) => console.error("Error from /me:", err)
        });
    }
}
