import { HttpInterceptorFn } from "@angular/common/http";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    //clones the request to add withCredentials: true
    //fundamental to make Cookie based sessions work
    const clonedRequest = req.clone({
        withCredentials: true
    });

    return next(clonedRequest);
};
