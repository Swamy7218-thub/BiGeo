import Fastify, { type FastifyInstance } from "fastify";
import { resolveAddress } from "./resolver.js";

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ status: "ok" }));

  app.post<{ Body: { rawAddress: string } }>("/v1/resolve", async (request, reply) => {
    const { rawAddress } = request.body ?? { rawAddress: "" };
    if (!rawAddress || typeof rawAddress !== "string") {
      return reply.code(400).send({ error: "rawAddress is required" });
    }
    const result = await resolveAddress(rawAddress);
    return reply.send(result);
  });

  return app;
}
