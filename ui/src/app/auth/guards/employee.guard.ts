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
            if (user && user.loggedIn) {
                //TODO: 
                // check if user role is employee
                // as of now everybody has access
                return true;
            }

            router.navigate(['/login']);
            return false;
        })
    );
};
