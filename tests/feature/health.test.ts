import { app } from "../../src/www/server";
import request, { type Response } from "supertest";

describe("Health Check Endpoint", function () {
  it("should return a success status and a valid health message", async function () {
    const res: Response = await request(app).get("/api/v1/health");

    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty(
      "message",
      "✅ Server is healthy and running now"
    );
  });
});
