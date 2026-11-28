import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../app.js";
import { getToken } from "./helpers.js";

describe("Health, Groups, Members, and Contributions API", () => {
  it("GET /health returns 200 with connected susu-test database status and no secrets", async () => {
    // Arrange & Act
    const response = await request(app).get("/health");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.database.status).toBe("connected");
    expect(response.body.database.name).toMatch(/-test$/);
    expect(JSON.stringify(response.body)).not.toContain("JWT_SECRET");
  });

  it("POST /groups creates a group linked to the logged-in owner", async () => {
    // Arrange
    const { token, user } = await getToken({ email: "owner@susu.test" });

    // Act
    const response = await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Market Women Circle",
        contributionAmount: 50,
        frequency: "weekly",
      });

    // Assert
    expect(response.status).toBe(201);
    expect(mongoose.isValidObjectId(response.body._id)).toBe(true);
    expect(response.body.name).toBe("Market Women Circle");
    expect(response.body.owner._id).toBe(user._id);
    expect(response.body.owner.email).toBe("owner@susu.test");
    expect(response.body.owner.passwordHash).toBeUndefined();
  });

  it("GET /groups stays public, populates owner email and memberCount, and supports search, sort, and pagination", async () => {
    // Arrange
    const { token: amaToken } = await getToken({ email: "ama@susu.test" });
    const { token: kojoToken } = await getToken({ email: "kojo@susu.test" });

    const market = await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${amaToken}`)
      .send({ name: "Market Women Circle", contributionAmount: 50 });

    await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${amaToken}`)
      .send({ name: "Alpha Savers", contributionAmount: 20 });

    await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${kojoToken}`)
      .send({ name: "Zebra Circle", contributionAmount: 100 });

    await request(app)
      .post("/members")
      .set("Authorization", `Bearer ${amaToken}`)
      .send({ group: market.body._id, name: "Esi" });

    await request(app)
      .post("/members")
      .set("Authorization", `Bearer ${amaToken}`)
      .send({ group: market.body._id, name: "Abena" });

    // Act
    const page1 = await request(app).get("/groups?sort=name&page=1&limit=2");
    const page2 = await request(app).get("/groups?sort=name&page=2&limit=2");
    const searched = await request(app).get("/groups?search=market");

    // Assert
    expect(page1.status).toBe(200);
    expect(page1.body.groups).toHaveLength(2);
    expect(page1.body.groups[0].name).toBe("Alpha Savers");
    expect(page1.body.groups[1].name).toBe("Market Women Circle");
    expect(page1.body.groups[1].owner.email).toBe("ama@susu.test");
    expect(page1.body.groups[1].owner.passwordHash).toBeUndefined();
    expect(page1.body.groups[1].memberCount).toBe(2);
    expect(page1.body.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
      hasPrev: false,
      hasNext: true,
    });

    expect(page2.status).toBe(200);
    expect(page2.body.groups).toHaveLength(1);
    expect(page2.body.groups[0].name).toBe("Zebra Circle");

    expect(searched.status).toBe(200);
    expect(searched.body.groups).toHaveLength(1);
    expect(searched.body.groups[0].name).toBe("Market Women Circle");
  });

  it("GET /groups/mine returns only the logged-in user's groups and rejects unauthenticated requests", async () => {
    // Arrange
    const { token: amaToken } = await getToken({ email: "ama@susu.test" });
    const { token: kojoToken } = await getToken({ email: "kojo@susu.test" });

    await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${amaToken}`)
      .send({ name: "Ama Circle", contributionAmount: 50 });

    await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${kojoToken}`)
      .send({ name: "Kojo Circle", contributionAmount: 30 });

    // Act
    const unauth = await request(app).get("/groups/mine");
    const amaMine = await request(app)
      .get("/groups/mine")
      .set("Authorization", `Bearer ${amaToken}`);

    // Assert
    expect(unauth.status).toBe(401);
    expect(amaMine.status).toBe(200);
    expect(amaMine.body.groups).toHaveLength(1);
    expect(amaMine.body.groups[0].name).toBe("Ama Circle");
    expect(amaMine.body.groups[0].owner.email).toBe("ama@susu.test");
  });

  it("creates contributions, populates member names, and calculates totalSaved on the server", async () => {
    // Arrange
    const { token } = await getToken({ email: "ama@susu.test" });
    const group = await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Market Circle", contributionAmount: 50 });
    const groupId = group.body._id;

    const esi = await request(app)
      .post("/members")
      .set("Authorization", `Bearer ${token}`)
      .send({ group: groupId, name: "Esi" });

    const abena = await request(app)
      .post("/members")
      .set("Authorization", `Bearer ${token}`)
      .send({ group: groupId, name: "Abena" });

    // Act
    const first = await request(app)
      .post("/contributions")
      .set("Authorization", `Bearer ${token}`)
      .send({ group: groupId, member: esi.body._id, amount: 50 });

    const second = await request(app)
      .post("/contributions")
      .set("Authorization", `Bearer ${token}`)
      .send({ group: groupId, member: abena.body._id, amount: 75.5 });

    const list = await request(app).get(`/groups/${groupId}/contributions`);

    // Assert
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(list.status).toBe(200);
    expect(list.body.contributions).toHaveLength(2);
    expect(list.body.totalSaved).toBe(125.5);
    expect(
      list.body.contributions.map((entry) => entry.member.name).sort(),
    ).toEqual(["Abena", "Esi"]);
  });

  it("returns 401 when unauthenticated requests call protected POST, PATCH, or DELETE routes", async () => {
    // Arrange
    const fakeId = new mongoose.Types.ObjectId().toString();

    // Act
    const createRes = await request(app)
      .post("/groups")
      .send({ name: "Blocked", contributionAmount: 25 });
    const patchRes = await request(app)
      .patch(`/groups/${fakeId}`)
      .send({ name: "Blocked" });
    const deleteRes = await request(app).delete(`/groups/${fakeId}`);
    const contribRes = await request(app)
      .post("/contributions")
      .send({ group: fakeId, member: fakeId, amount: 25 });

    // Assert
    expect(createRes.status).toBe(401);
    expect(patchRes.status).toBe(401);
    expect(deleteRes.status).toBe(401);
    expect(contribRes.status).toBe(401);
  });

  it("returns 400 on validation failures when creating a group with missing name or invalid amount", async () => {
    // Arrange
    const { token } = await getToken({ email: "validator@susu.test" });

    // Act
    const emptyName = await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "   ", contributionAmount: 50 });

    const zeroAmount = await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Zero Circle", contributionAmount: 0 });

    // Assert
    expect(emptyName.status).toBe(400);
    expect(zeroAmount.status).toBe(400);
  });

  it("returns 403 when a non-owner tries to PATCH or DELETE another user's group", async () => {
    // Arrange
    const { token: ownerToken } = await getToken({ email: "owner@susu.test" });
    const { token: otherToken } = await getToken({ email: "other@susu.test" });

    const created = await request(app)
      .post("/groups")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Private Circle", contributionAmount: 40 });
    const groupId = created.body._id;

    // Act
    const forbiddenPatch = await request(app)
      .patch(`/groups/${groupId}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ name: "Hijacked Circle" });

    const forbiddenDelete = await request(app)
      .delete(`/groups/${groupId}`)
      .set("Authorization", `Bearer ${otherToken}`);

    // Assert
    expect(forbiddenPatch.status).toBe(403);
    expect(forbiddenDelete.status).toBe(403);
  });

  it("returns 400 when looking up a group with an invalid MongoDB ObjectId", async () => {
    // Arrange & Act
    const response = await request(app).get("/groups/not-a-valid-object-id");

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/invalid/i);
  });

  it("returns 404 when looking up a valid ObjectId that does not exist", async () => {
    // Arrange
    const missingId = new mongoose.Types.ObjectId().toString();

    // Act
    const response = await request(app).get(`/groups/${missingId}`);

    // Assert
    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/i);
  });
});
