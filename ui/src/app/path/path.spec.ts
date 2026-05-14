import { ComponentFixture, TestBed } from "@angular/core/testing";

import { Path } from "./path";

describe("Path", () => {
    let component: Path;
    let fixture: ComponentFixture<Path>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Path]
        }).compileComponents();

        fixture = TestBed.createComponent(Path);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
