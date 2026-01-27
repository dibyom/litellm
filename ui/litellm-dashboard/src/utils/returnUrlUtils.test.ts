import {
  buildLoginUrlWithReturn,
  clearStoredReturnUrl,
  consumeReturnUrl,
  getCurrentUrl,
  getReturnUrl,
  getReturnUrlFromParams,
  getStoredReturnUrl,
  isValidReturnUrl,
  storeReturnUrl,
} from "./returnUrlUtils";

describe("returnUrlUtils", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Clear cookies before each test
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // Reset location mock
    Object.defineProperty(window, "location", {
      value: {
        href: "http://localhost:3000/ui?page=api-keys",
        origin: "http://localhost:3000",
        hostname: "localhost",
        pathname: "/ui",
        search: "?page=api-keys",
      },
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  describe("getCurrentUrl", () => {
    it("should return the current URL", () => {
      const url = getCurrentUrl();
      expect(url).toBe("http://localhost:3000/ui?page=api-keys");
    });
  });

  describe("storeReturnUrl and getStoredReturnUrl", () => {
    it("should store and retrieve the return URL from cookie", () => {
      storeReturnUrl();
      const storedUrl = getStoredReturnUrl();
      expect(storedUrl).toBe("http://localhost:3000/ui?page=api-keys");
    });

    it("should return null if no URL is stored", () => {
      const storedUrl = getStoredReturnUrl();
      expect(storedUrl).toBeNull();
    });
  });

  describe("clearStoredReturnUrl", () => {
    it("should clear the stored return URL", () => {
      storeReturnUrl();
      expect(getStoredReturnUrl()).not.toBeNull();

      clearStoredReturnUrl();
      expect(getStoredReturnUrl()).toBeNull();
    });
  });

  describe("getReturnUrlFromParams", () => {
    it("should return the redirect_to parameter from URL", () => {
      Object.defineProperty(window, "location", {
        value: {
          ...window.location,
          search: "?redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fui%3Fcreate%3Dtrue",
        },
        writable: true,
      });

      const returnUrl = getReturnUrlFromParams();
      expect(returnUrl).toBe("http://localhost:3000/ui?create=true");
    });

    it("should return null if redirect_to parameter is not present", () => {
      Object.defineProperty(window, "location", {
        value: {
          ...window.location,
          search: "?page=api-keys",
        },
        writable: true,
      });

      const returnUrl = getReturnUrlFromParams();
      expect(returnUrl).toBeNull();
    });
  });

  describe("buildLoginUrlWithReturn", () => {
    it("should build login URL with return URL parameter", () => {
      Object.defineProperty(window, "location", {
        value: {
          ...window.location,
          href: "http://localhost:3000/ui?create=true&team_id=123",
        },
        writable: true,
      });

      const loginUrl = buildLoginUrlWithReturn("/ui/login");
      expect(loginUrl).toBe(
        "/ui/login?redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fui%3Fcreate%3Dtrue%26team_id%3D123"
      );
    });

    it("should not add return URL if already on login page", () => {
      Object.defineProperty(window, "location", {
        value: {
          ...window.location,
          href: "http://localhost:3000/ui/login",
        },
        writable: true,
      });

      const loginUrl = buildLoginUrlWithReturn("/ui/login");
      expect(loginUrl).toBe("/ui/login");
    });

    it("should handle login URL with existing query parameters", () => {
      Object.defineProperty(window, "location", {
        value: {
          ...window.location,
          href: "http://localhost:3000/ui?page=api-keys",
        },
        writable: true,
      });

      const loginUrl = buildLoginUrlWithReturn("/ui/login?foo=bar");
      expect(loginUrl).toContain("&redirect_to=");
    });
  });

  describe("getReturnUrl", () => {
    it("should prefer URL params over cookie", () => {
      // Store a URL in cookie
      storeReturnUrl();

      // Set a different URL in the params
      Object.defineProperty(window, "location", {
        value: {
          ...window.location,
          search: "?redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fui%3Fpage%3Dteams",
        },
        writable: true,
      });

      const returnUrl = getReturnUrl();
      expect(returnUrl).toBe("http://localhost:3000/ui?page=teams");
    });

    it("should fall back to cookie if no URL param", () => {
      // Store a URL in cookie first
      Object.defineProperty(window, "location", {
        value: {
          href: "http://localhost:3000/ui?create=true",
          origin: "http://localhost:3000",
          hostname: "localhost",
          pathname: "/ui",
          search: "?create=true",
        },
        writable: true,
      });
      storeReturnUrl();

      // Clear the URL params
      Object.defineProperty(window, "location", {
        value: {
          ...window.location,
          search: "",
        },
        writable: true,
      });

      const returnUrl = getReturnUrl();
      expect(returnUrl).toBe("http://localhost:3000/ui?create=true");
    });

    it("should return null if no return URL found", () => {
      Object.defineProperty(window, "location", {
        value: {
          ...window.location,
          search: "",
        },
        writable: true,
      });

      const returnUrl = getReturnUrl();
      expect(returnUrl).toBeNull();
    });
  });

  describe("isValidReturnUrl", () => {
    it("should validate relative URLs starting with /", () => {
      expect(isValidReturnUrl("/ui?page=api-keys")).toBe(true);
      expect(isValidReturnUrl("/ui/teams")).toBe(true);
    });

    it("should reject protocol-relative URLs", () => {
      expect(isValidReturnUrl("//evil.com")).toBe(false);
    });

    it("should validate same-hostname URLs (even with different ports)", () => {
      // Same hostname, same port
      expect(isValidReturnUrl("http://localhost:3000/ui?page=teams")).toBe(true);
      // Same hostname, different port (important for dev environments)
      expect(isValidReturnUrl("http://localhost:4000/ui?page=teams")).toBe(true);
    });

    it("should reject different-hostname URLs", () => {
      expect(isValidReturnUrl("http://evil.com/ui")).toBe(false);
      expect(isValidReturnUrl("https://google.com")).toBe(false);
    });

    it("should reject empty URLs", () => {
      expect(isValidReturnUrl("")).toBe(false);
    });

    it("should reject invalid URLs", () => {
      expect(isValidReturnUrl("not-a-url")).toBe(false);
    });
  });

  describe("consumeReturnUrl", () => {
    it("should return and clear the stored return URL", () => {
      Object.defineProperty(window, "location", {
        value: {
          href: "http://localhost:3000/ui?create=true",
          origin: "http://localhost:3000",
          hostname: "localhost",
          pathname: "/ui",
          search: "?create=true",
        },
        writable: true,
      });
      storeReturnUrl();

      // Clear the URL params for the consume call
      Object.defineProperty(window, "location", {
        value: {
          href: "http://localhost:3000/ui/login",
          origin: "http://localhost:3000",
          hostname: "localhost",
          pathname: "/ui/login",
          search: "",
        },
        writable: true,
      });

      const returnUrl = consumeReturnUrl();
      expect(returnUrl).toBe("http://localhost:3000/ui?create=true");
      expect(getStoredReturnUrl()).toBeNull();
    });

    it("should return null for invalid return URLs (different hostname)", () => {
      // Manually set an invalid URL in cookie
      document.cookie = "litellm_return_url=" + encodeURIComponent("http://evil.com/phishing") + "; path=/";

      const returnUrl = consumeReturnUrl();
      expect(returnUrl).toBeNull();
    });

    it("should allow URLs with different ports on same hostname", () => {
      // Store URL with port 3000
      Object.defineProperty(window, "location", {
        value: {
          href: "http://localhost:3000/ui?create=true",
          origin: "http://localhost:3000",
          hostname: "localhost",
          pathname: "/ui",
          search: "?create=true",
        },
        writable: true,
      });
      storeReturnUrl();

      // Now we're on port 4000
      Object.defineProperty(window, "location", {
        value: {
          href: "http://localhost:4000/ui",
          origin: "http://localhost:4000",
          hostname: "localhost",
          pathname: "/ui",
          search: "",
        },
        writable: true,
      });

      const returnUrl = consumeReturnUrl();
      // Should be valid because same hostname (localhost)
      expect(returnUrl).toBe("http://localhost:3000/ui?create=true");
    });

    it("should return null if no return URL found", () => {
      Object.defineProperty(window, "location", {
        value: {
          ...window.location,
          search: "",
        },
        writable: true,
      });

      const returnUrl = consumeReturnUrl();
      expect(returnUrl).toBeNull();
    });
  });
});
