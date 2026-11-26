import assert from "node:assert/strict";
import test from "node:test";
import {
  api,
  attachAuthHeader,
  clearAuthToken,
  getAuthToken,
  handleResponseError,
  onUnauthorized,
  setAuthToken,
} from "../src/api.js";

test("Axios auth helper attaches Bearer token and clears it on logout", () => {
  clearAuthToken();
  assert.equal(getAuthToken(), "");

  const unauthenticated = attachAuthHeader({ headers: {} });
  assert.equal(unauthenticated.headers.Authorization, undefined);

  setAuthToken("sample.jwt.token");
  assert.equal(getAuthToken(), "sample.jwt.token");
  assert.equal(
    api.defaults.headers.common.Authorization,
    "Bearer sample.jwt.token",
  );

  const authenticated = attachAuthHeader({ headers: {} });
  assert.equal(authenticated.headers.Authorization, "Bearer sample.jwt.token");

  clearAuthToken();
  assert.equal(getAuthToken(), "");
  assert.equal(api.defaults.headers.common.Authorization, undefined);
});

test("401 response interceptor clears token and notifies listeners except on login/register attempts", async () => {
  let unauthorizedCalls = 0;
  const unsubscribe = onUnauthorized(() => {
    unauthorizedCalls += 1;
  });

  setAuthToken("expired.jwt.token");

  await assert.rejects(() =>
    handleResponseError({
      response: { status: 401 },
      config: { url: "/auth/login" },
    }),
  );
  assert.equal(unauthorizedCalls, 0);
  assert.equal(getAuthToken(), "expired.jwt.token");

  await assert.rejects(() =>
    handleResponseError({
      response: { status: 401 },
      config: { url: "/groups/mine" },
    }),
  );
  assert.equal(unauthorizedCalls, 1);
  assert.equal(getAuthToken(), "");

  unsubscribe();
});
