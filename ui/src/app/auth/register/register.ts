import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../services/auth.service";

@Component({
    selector: "app-register",
    imports: [FormsModule, RouterLink],
    templateUrl: "./register.html"
})
export class Register {
    email = "";
    password = "";
    confirmPassword = "";
    errorMessage = "";
    isLoading = false;

    constructor(private authService: AuthService, private router: Router) { }

    onSubmit() {
        this.errorMessage = "";

        if (this.password !== this.confirmPassword) {
            this.errorMessage = "Le password non coincidono!";
            return;
        }

        this.isLoading = true;

        this.authService.register({ email: this.email, password: this.password }).subscribe({
            next: () => {
                alert("Registrazione completata con successo! Ora puoi accedere.");
                this.router.navigate(["/login"]);
            },
            error: (err) => {
                console.error("Errore di registrazione:", err);
                this.errorMessage = err.error?.message || "Errore durante la registrazione.";
                this.isLoading = false;
            }
        });
    }
}
