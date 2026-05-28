import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../services/auth.service";

@Component({
    selector: "app-login",
    imports: [FormsModule, RouterLink],
    templateUrl: "./login.html"
})
export class Login {
    email = "";
    password = "";
    errorMessage = "";

    constructor(private authService: AuthService, private router: Router) { }

    onSubmit() {
        this.errorMessage = "";
        this.authService.login({ email: this.email, password: this.password }).subscribe({
            next: () => {
                // Il browser salverà automaticamente il cookie HttpOnly. 
                // Navighiamo verso la mappa principale.
                this.router.navigate(["/"]);
            },
            error: (err) => {
                console.error("Errore di login:", err);
                this.errorMessage = "Email o password non validi. Riprova.";
            }
        });
    }
}
