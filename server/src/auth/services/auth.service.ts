import { Injectable } from "@nestjs/common";

@Injectable()
export class AuthService {
    async validateUser(email: string, pass: string): Promise<any> {
        // fake user to test login (Mongoose is needed)
        const mockUser = { _id: "123", email: "user@example.com", password: "password123" };
        const user = email === mockUser.email ? mockUser : null;

        if (user) {
            const isMatch = pass === user.password; // at launch use bcrypt.compare()

            if (isMatch) {
                const { password, ...result } = user;
                return result;
            }
        }
        return null;
    }
}
