import { Routes } from "@angular/router";
import { Map } from "./map/map";
import { Login } from "./auth/login/login";
import { Register } from "./auth/register/register";
import { Favourites } from "../app/favourites/favourites";

export const routes: Routes = [
    {
        path: "",
        component: Map,
        children: [
            { path: "login", component: Login },
            { path: "register", component: Register },
            { path: "favourites", component: Favourites }
        ]
    },
    { path: "**", redirectTo: "" }
];
