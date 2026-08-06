import { expect } from "chai";
import type { NextRequest } from "next/server";
import { isAuthorizedInternalRequest } from "../lib/internal-auth.ts";

function requestWithToken(token?: string) {
  const headers = new Headers();
  if (token) headers.set("authorization", `Bearer ${token}`);
  return { headers } as NextRequest;
}

describe("internal operational route authentication", function () {
  const originalSecret = process.env.CRON_SECRET;

  afterEach(function () {
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
  });

  it("fails closed when the server secret is missing", function () {
    delete process.env.CRON_SECRET;
    expect(isAuthorizedInternalRequest(requestWithToken("secret"))).to.equal(false);
  });

  it("accepts only the exact bearer secret", function () {
    process.env.CRON_SECRET = "correct-secret";
    expect(isAuthorizedInternalRequest(requestWithToken("wrong-secret"))).to.equal(false);
    expect(isAuthorizedInternalRequest(requestWithToken("correct-secret"))).to.equal(true);
  });
});
