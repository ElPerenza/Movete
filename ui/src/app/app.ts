import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { Map } from "./map/map";

@Component({
    selector: "app-root",
    imports: [RouterOutlet, Map],
    templateUrl: "./app.html",
    styleUrl: "./app.css"
})
export class App {
    protected readonly title = "Movete";
}
