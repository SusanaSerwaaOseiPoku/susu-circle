import request from "supertest";
import app from "../app.js";

let userCounter = 0;

export async function getToken(overrides = {}) {
  userCounter += 1;
  const credentials = {
    name: overrides.name ?? `Test User ${userCounter}`,
    email: overrides.email ?? `user${userCounter}@susu-test.local`,
    password: overrides.password ?? "password123",
  };

  const registerResponse = await request(app)
    .post("/auth/register")
    .send(credentials);

  if (registerResponse.status === 201) {
    return {
      token: registerResponse.body.token,
      user: registerResponse.body.user,
      credentials,
    };
  }

  const loginResponse = await request(app).post("/auth/login").send({
    email: credentials.email,
    password: credentials.password,
  });

  if (loginResponse.status !== 200) {
    throw new Error(
      `getToken failed (${loginResponse.status}): ${JSON.stringify(loginResponse.body)}`,
    );
  }

  return {
    token: loginResponse.body.token,
    user: loginResponse.body.user,
    credentials,
  };
}
