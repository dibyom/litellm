"use client";

import { getProxyBaseUrl } from "@/components/networking";
import { clearTokenCookies, getCookie } from "@/utils/cookieUtils";
import { isJwtExpired } from "@/utils/jwtUtils";
import { buildLoginUrlWithReturn, storeReturnUrl } from "@/utils/returnUrlUtils";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { formatUserRole } from "@/utils/roles";
import { useUIConfig } from "./uiConfig/useUIConfig";

const useAuthorized = () => {
  const router = useRouter();
  const { data: uiConfig, isLoading: isUIConfigLoading } = useUIConfig();

  const token = typeof document !== "undefined" ? getCookie("token") : null;

  // Helper function to redirect to login while preserving the current URL
  const redirectToLogin = useCallback(() => {
    // Store the current URL so we can redirect back after login
    storeReturnUrl();
    const baseLoginUrl = `${getProxyBaseUrl()}/ui/login`;
    const loginUrlWithReturn = buildLoginUrlWithReturn(baseLoginUrl);
    router.replace(loginUrlWithReturn);
  }, [router]);
  // Step 1: Check for missing token or expired JWT - kick out immediately (even if UI Config is loading)
  useEffect(() => {
    if (!token || (token && isJwtExpired(token))) {
      if (token) {
        clearTokenCookies();
      }
      redirectToLogin();
    }
  }, [token, redirectToLogin]);

  useEffect(() => {
    if (isUIConfigLoading) {
      return;
    }
    if (uiConfig?.admin_ui_disabled) {
      redirectToLogin();
    }
  }, [isUIConfigLoading, uiConfig, redirectToLogin]);

  // Decode safely
  const decoded = useMemo(() => {
    if (!token) return null;
    try {
      return jwtDecode(token) as Record<string, any>;
    } catch {
      // Bad token in cookie — clear and bounce
      clearTokenCookies();
      redirectToLogin();
      return null;
    }
  }, [token, redirectToLogin]);

  return {
    token: token,
    accessToken: decoded?.key ?? null,
    userId: decoded?.user_id ?? null,
    userEmail: decoded?.user_email ?? null,
    userRole: formatUserRole(decoded?.user_role ?? null),
    premiumUser: decoded?.premium_user ?? null,
    disabledPersonalKeyCreation: decoded?.disabled_non_admin_personal_key_creation ?? null,
    showSSOBanner: decoded?.login_method === "username_password",
  };
};

export default useAuthorized;
