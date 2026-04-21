import { useState, useCallback } from 'react';

const KEY = 'buchscanner_profile';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}

function persist(p) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function useProfile() {
  const [profile, setProfile] = useState(load);

  const saveProfile = useCallback((data) => {
    persist(data);
    setProfile(data);
  }, []);

  return { profile, saveProfile, hasProfile: !!profile };
}
