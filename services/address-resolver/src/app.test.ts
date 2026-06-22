import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

describe("address-resolver app", () => {
  it("returns ok on /health", async () => {
    const app = buildApp();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });

  it("rejects /v1/resolve without rawAddress", async () => {
    const app = buildApp();
    const res = await app.inject({ method: "POST", url: "/v1/resolve", payload: {} });
    expect(res.statusCode).toBe(400);
  });

  it("resolves /v1/resolve with a stubbed result", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/resolve",
      payload: { rawAddress: "Near Shiv Mandir, Rampur, UP" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ matched: false, villageId: null });
  });
});
