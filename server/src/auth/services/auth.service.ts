import { Injectable, ConflictException } from "@nestjs/common";
import * as bcrypt from "bcrypt";

//dummy user for test purposes:
const mockUser = [
    { _id: "123", email: "user@example.com", password: "password123" }
];

@Injectable()
export class AuthService {
    async register(email: string, pass: string): Promise<any> {
        const existingUser = mockUser.find(u => u.email === email);
        if (existingUser) {
            throw new ConflictException("Email già in uso");
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(pass, saltRounds);

        const newUser = {
            _id: Math.random().toString(36).substring(7),
            email: email,
            password: hashedPassword
        };
        mockUser.push(newUser);

        const { password, ...result } = newUser;
        return result;
    }
    async validateUser(email: string, pass: string): Promise<any> {
        const user = mockUser.find(u => u.email === email);

        if (user) {
            const isMatch = user.password === "password123"
                ? pass === user.password
                : await bcrypt.compare(pass, user.password);

            if (isMatch) {
                const { password, ...result } = user;
                return result;
            }
        }
        return null;
    }


}
