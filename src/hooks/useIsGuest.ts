"use client";
import { useEffect, useState } from "react";

const GUEST_EMAIL = "test_guest@smart-wealth.local";

/** 判断当前用户是否为游客 */
export function useIsGuest(): boolean {
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const loginInfo = localStorage.getItem("loginInfo");
    if (loginInfo) {
      try {
        const parsed = JSON.parse(loginInfo);
        setIsGuest(parsed.email === GUEST_EMAIL);
      } catch {
        setIsGuest(false);
      }
    }
  }, []);

  return isGuest;
}
