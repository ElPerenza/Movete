import { Routes } from "@angular/router";
import { Map } from "./map/map";
import { Login } from "./auth/login/login";
import { Register } from "./auth/register/register";
import { Favourites } from "../app/favourites/favourites";
import { Dashboard } from './dashboard/dashboard';
import { employeeGuard } from "./auth/guards/employee.guard";

export const routes: Routes = [
    {
        path: "",
        component: Map,
        children: [
            { path: "login", component: Login },
            { path: "register", component: Register },
            { path: "favourites", component: Favourites },
        ]
    },
    {
        path: 'backoffice',
        component: Dashboard,
        canActivate: [employeeGuard]
    },
    { path: "**", redirectTo: "" }
];
