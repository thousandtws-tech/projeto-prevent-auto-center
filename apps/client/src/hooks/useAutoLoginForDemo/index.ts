import { useCallback, useEffect, useState } from "react";
import { authProvider } from "../../authProvider";
import { isBackendApiEnabled } from "../../services/httpClient";
import {
  disableAutoLogin as disableAutoLoginStorage,
  enableAutoLogin as enableAutoLoginStorage,
} from "../autoLoginStorage";

/**
 * This hook is used to automatically login the user.
 * We use this hook to skip the login page and demonstrate the application more quickly.
 */
export const useAutoLoginForDemo = () => {
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback(async () => {
    try {
      await authProvider.login({
        email: "demo@refine.dev",
        password: "demodemo",
      });
    } catch (_error) {
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isBackendApiEnabled()) {
      setIsLoading(false);
      return;
    }

    const shouldLogin = localStorage.getItem("auto_login") !== "false";
    if (!shouldLogin) {
      setIsLoading(false);
      return;
    }

    login();
  }, [login]);

  return { loading: isLoading };
};

/**
 *  Enable auto login feature.
 *  This is used to skip the login page and demonstrate the application more quickly.
 */
export const enableAutoLogin = () => {
  enableAutoLoginStorage();
};

/**
 *  Disable auto login feature.
 *  This is used to skip the login page and demonstrate the application more quickly.
 */
export const disableAutoLogin = () => {
  disableAutoLoginStorage();
};
