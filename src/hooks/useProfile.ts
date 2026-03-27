import { useMemo, useSyncExternalStore, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  avatar: string;
  displayName?: string;
}

// Avatar options — keys map to image filenames in src/assets/avatars/
export const AVATAR_OPTIONS = [
  'avatar-1',
  'avatar-2',
  'avatar-3',
  'avatar-4',
  'avatar-5',
  'avatar-6',
] as const;

export type AvatarId = (typeof AVATAR_OPTIONS)[number];

type ProfileState = { profile: Profile | null; loading: boolean };

function createProfileStore(userId?: string) {
  let state: ProfileState = { profile: null, loading: !!userId };
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());

  const set = (next: ProfileState) => {
    state = next;
    notify();
  };

  if (userId) {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        set({ profile: { id: data.id, avatar: data.avatar, displayName: data.display_name ?? undefined }, loading: false });
        return;
      }

      const pendingAvatar = localStorage.getItem('apollo_pending_avatar') ?? 'avatar-1';
      localStorage.removeItem('apollo_pending_avatar');
      const { data: newProfile } = await supabase
        .from('profiles')
        .upsert({ id: userId, avatar: pendingAvatar })
        .select()
        .single();

      const profile: Profile = newProfile
        ? { id: newProfile.id, avatar: newProfile.avatar, displayName: newProfile.display_name ?? undefined }
        : { id: userId, avatar: pendingAvatar };
      set({ profile, loading: false });
    })();
  }

  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    updateProfile: (profile: Profile) => set({ ...state, profile }),
  };
}

export function useProfile(userId?: string) {
  const store = useMemo(() => createProfileStore(userId), [userId]);

  const subscribe = useCallback((cb: () => void) => store.subscribe(cb), [store]);
  const getSnapshot = useCallback(() => store.getSnapshot(), [store]);
  const { profile, loading } = useSyncExternalStore(subscribe, getSnapshot);

  const createProfile = useCallback(async (avatar: string) => {
    if (!userId) return;
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, avatar });
    if (!error) {
      store.updateProfile({ id: userId, avatar });
    }
    return { error };
  }, [userId, store]);

  const updateAvatar = useCallback(async (avatar: string) => {
    if (!userId || !profile) return;
    const { error } = await supabase
      .from('profiles')
      .update({ avatar })
      .eq('id', userId);
    if (!error) {
      store.updateProfile({ ...profile, avatar });
    }
    return { error };
  }, [userId, profile, store]);

  return { profile, loading, createProfile, updateAvatar };
}
