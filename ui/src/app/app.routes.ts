import { Routes } from "@angular/router";
import { Map } from "./map/map";
import { Login } from "./auth/login/login";
import { Register } from "./auth/register/register";

export const routes: Routes = [
    { path: "login", component: Login },
    { path: "register", component: Register },
    { path: "", component: Map },
    { path: "**", redirectTo: "" },
];
