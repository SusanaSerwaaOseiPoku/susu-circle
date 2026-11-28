import { describe, expect, it } from "vitest";
import { getCorsOptions } from "../app.js";
import { calculateContributionTotal } from "../utils/contributions.js";

describe("calculateContributionTotal (pure unit tests)", () => {
  it("returns 0 for an empty list of contributions", () => {
    // Arrange
    const contributions = [];

    // Act
    const total = calculateContributionTotal(contributions);

    // Assert
    expect(total).toBe(0);
  });

  it("sums multiple positive contribution amounts accurately", () => {
    // Arrange
    const contributions = [
      { amount: 50 },
      { amount: 75 },
      { amount: 125 },
    ];

    // Act
    const total = calculateContributionTotal(contributions);

    // Assert
    expect(total).toBe(250);
  });

  it("avoids floating-point drift with decimal amounts", () => {
    // Arrange
    const contributions = [{ amount: 10.1 }, { amount: 20.2 }];

    // Act
    const total = calculateContributionTotal(contributions);

    // Assert
    expect(total).toBe(30.3);
  });

  it("safely ignores invalid, negative, zero, and non-array inputs", () => {
    // Arrange
    const mixed = [
      { amount: 40 },
      { amount: -10 },
      { amount: 0 },
      { amount: "not-a-number" },
      null,
      { amount: 60 },
    ];

    // Act & Assert
    expect(calculateContributionTotal(mixed)).toBe(100);
    expect(calculateContributionTotal(null)).toBe(0);
    expect(calculateContributionTotal(undefined)).toBe(0);
  });

  it("getCorsOptions allows production and Vercel preview origins while blocking unknown origins", async () => {
    // Arrange
    const corsOptions = getCorsOptions(
      "https://susu-circle.vercel.app/, https://susu-circle-*.vercel.app",
    );

    const checkOrigin = (origin) =>
      new Promise((resolve) => {
        corsOptions.origin(origin, (error, allowed) => {
          resolve({ error, allowed });
        });
      });

    // Act
    const prodResult = await checkOrigin("https://susu-circle.vercel.app");
    const previewResult = await checkOrigin(
      "https://susu-circle-git-preview-branch.vercel.app",
    );
    const blockedResult = await checkOrigin("https://evil.example.com");

    // Assert
    expect(prodResult.error).toBeNull();
    expect(prodResult.allowed).toBe(true);
    expect(previewResult.error).toBeNull();
    expect(previewResult.allowed).toBe(true);
    expect(blockedResult.error).toBeInstanceOf(Error);
  });
});
