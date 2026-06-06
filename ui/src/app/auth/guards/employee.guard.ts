import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const employeeGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Controlliamo la sessione chiamando il backend
    return authService.checkInitialSession().pipe(
        map(user => {
            if (user && user.loggedIn && user.role == 'employee') {
                return true;
            }

            console.warn("Access denied: unauthorized user");

            router.navigate(['/']);
            return false;
        })
    );
};
