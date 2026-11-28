import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../app.js";
import User from "../models/User.js";
import { getToken } from "./helpers.js";

describe("Authentication endpoints (/auth)", () => {
  it("POST /auth/register creates a user, hashes the password, and returns a JWT token", async () => {
    // Arrange
    const payload = {
      name: "Ama Mensah",
      email: "Ama@Susu.Test",
      password: "secret-password",
    };

    // Act
    const response = await request(app).post("/auth/register").send(payload);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.email).toBe("ama@susu.test");
    expect(response.body.user.passwordHash).toBeUndefined();

    const saved = await User.findOne({ email: "ama@susu.test" });
    expect(saved).not.toBeNull();
    expect(saved.passwordHash).not.toBe("secret-password");
    expect(saved.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it("POST /auth/register rejects repeated emails with 409", async () => {
    // Arrange
    await getToken({ email: "repeat@susu.test", password: "password123" });

    // Act
    const duplicate = await request(app).post("/auth/register").send({
      name: "Second Account",
      email: "  REPEAT@susu.test ",
      password: "other-password",
    });

    // Assert
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.message).toMatch(/already exists/i);
  });

  it("POST /auth/login returns a JWT token for valid credentials", async () => {
    // Arrange
    await getToken({ email: "login@susu.test", password: "password123" });

    // Act
    const response = await request(app).post("/auth/login").send({
      email: "login@susu.test",
      password: "password123",
    });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.email).toBe("login@susu.test");
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it("POST /auth/login returns 401 for wrong password or unknown email", async () => {
    // Arrange
    await getToken({ email: "valid@susu.test", password: "password123" });

    // Act
    const wrongPassword = await request(app).post("/auth/login").send({
      email: "valid@susu.test",
      password: "wrong-password",
    });
    const unknownEmail = await request(app).post("/auth/login").send({
      email: "nobody@susu.test",
      password: "password123",
    });

    // Assert
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
  });

  it("GET /auth/me returns the logged-in user without secrets and 401 without a token", async () => {
    // Arrange
    const { token } = await getToken({ email: "me@susu.test" });

    // Act
    const unauthenticated = await request(app).get("/auth/me");
    const authenticated = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    // Assert
    expect(unauthenticated.status).toBe(401);
    expect(authenticated.status).toBe(200);
    expect(authenticated.body.user.email).toBe("me@susu.test");
    expect(authenticated.body.user.passwordHash).toBeUndefined();
  });
});
