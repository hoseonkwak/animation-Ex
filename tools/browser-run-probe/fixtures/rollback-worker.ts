import { rollbackAutoPublicationBatch } from "../../../apps/lab/server/autoPublication";

export default {
  async fetch(request: Request, env: { DB: D1Database }): Promise<Response> {
    if (
      request.method !== "POST" ||
      new URL(request.url).pathname !== "/rollback"
    ) {
      return new Response("Not found", { status: 404 });
    }
    await rollbackAutoPublicationBatch(
      env.DB,
      "auto-test-batch-1",
      "local-test-actor",
    );
    return Response.json({ rolledBack: true });
  },
};
