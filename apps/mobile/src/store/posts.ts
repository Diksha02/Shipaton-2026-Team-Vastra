import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { OutfitLayers } from './outfit';

export type PostSource = 'photo' | 'outfit';

/** Every post carries its own moderation state. Nothing reaches a feed before
 *  it has passed — see the note on `visiblePosts` below. */
export type PostModeration = 'pending' | 'passed' | 'blocked';

export interface Post {
  id: string;
  /** Local file URI (camera/gallery) or null when the post is a composed outfit. */
  imageUri: string | null;
  /** Set when the post came from the Studio rather than the camera. */
  layers: OutfitLayers | null;
  caption: string;
  authorHandle: string;
  createdAt: string;
  likes: number;
  likedByMe: boolean;
  moderation: PostModeration;
  source: PostSource;
}

interface PostsState {
  posts: Post[];
  /**
   * Handles this user never wants to see again.
   *
   * Blocking a *person* is a distinct requirement from hiding a *post*: Google
   * Play's UGC policy and Apple guideline 1.2 both require the ability to block
   * an abusive user, and reporting each of their posts one at a time is not
   * that. Stored as handles because that is the identity the feed carries until
   * the API lands.
   */
  blockedHandles: string[];
  hydrated: boolean;
  add: (input: {
    imageUri: string | null;
    layers: OutfitLayers | null;
    caption: string;
    source: PostSource;
  }) => Post;
  remove: (id: string) => void;
  toggleLike: (id: string) => void;
  /** Marks a post blocked. Wired to the real moderation pipeline (§5.1) once the
   *  API exists; until then it backs the in-app report action. */
  block: (id: string) => void;
  /** Hides everything by this author, now and in future. */
  blockAuthor: (handle: string) => void;
  unblockAuthor: (handle: string) => void;
}

export const usedPostsStorageKey = 'vastra.posts';

export const usePosts = create<PostsState>()(
  persist(
    (set) => ({
      posts: [],
      blockedHandles: [],
      hydrated: false,

      add: ({ imageUri, layers, caption, source }) => {
        const post: Post = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          imageUri,
          layers: layers ? { ...layers } : null,
          caption: caption.trim(),
          authorHandle: '@you',
          createdAt: new Date().toISOString(),
          likes: 0,
          likedByMe: false,
          // Optimistic locally, because the poster is the only viewer on this
          // device. Server-side this starts 'pending' and the worker decides.
          moderation: 'passed',
          source,
        };
        set((state) => ({ posts: [post, ...state.posts] }));
        return post;
      },

      remove: (id) => set((state) => ({ posts: state.posts.filter((p) => p.id !== id) })),

      toggleLike: (id) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id
              ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) }
              : p,
          ),
        })),

      blockAuthor: (handle) =>
        set((state) => ({
          blockedHandles: state.blockedHandles.includes(handle)
            ? state.blockedHandles
            : [...state.blockedHandles, handle],
        })),

      unblockAuthor: (handle) =>
        set((state) => ({
          blockedHandles: state.blockedHandles.filter((h) => h !== handle),
        })),

      block: (id) =>
        set((state) => ({
          posts: state.posts.map((p) => (p.id === id ? { ...p, moderation: 'blocked' } : p)),
        })),
    }),
    {
      name: usedPostsStorageKey,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ posts: state.posts, blockedHandles: state.blockedHandles }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

/**
 * The only list a feed should ever render.
 *
 * Blocked and pending posts are filtered here rather than at each call site,
 * so a new screen cannot accidentally show unmoderated content. Apple
 * Guideline 1.2 and Google's UGC policy both require content to be filtered
 * before it is visible, and "we forgot on one screen" is exactly how apps get
 * rejected.
 */
export function useVisiblePosts(): Post[] {
  // The selector must return a STABLE reference. Filtering inside it builds a
  // new array on every call, which Zustand compares by identity, sees as a
  // change, and re-renders — forever. Select the raw array, then derive.
  const posts = usePosts((s) => s.posts);
  const blocked = usePosts((s) => s.blockedHandles);
  return useMemo(
    () =>
      posts.filter((p) => p.moderation === 'passed' && !blocked.includes(p.authorHandle)),
    [posts, blocked],
  );
}
