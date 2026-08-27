import request from "supertest";
import app from "../../app.js";

describe("Review API", () => {
  test("redirects unauthenticated user to login", async () => {
    const response = await request(app)
      .post("/user/reviews")
      .send({
        productId: "68c123456789012345678901",
        rating: 5,
        comment: "Good product",
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/user/login");
  });
});
