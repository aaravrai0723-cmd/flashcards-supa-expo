import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  // Theme
  isDarkMode: boolean;
  toggleTheme: () => void;
  
  // Draft deck state
  draftDeck: {
    title: string;
    description: string;
    visibility: 'public' | 'private';
    subjects: string[];
    gradeBands: string[];
  };
  updateDraftDeck: (updates: Partial<AppState['draftDeck']>) => void;
  clearDraftDeck: () => void;
  
  // UI state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  
  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    timestamp: number;
  }>;
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // User preferences
  preferences: {
    autoPlayVideos: boolean;
    showHints: boolean;
    quizDifficulty: 'easy' | 'medium' | 'hard';
    notificationsEnabled: boolean;
  };
  updatePreferences: (updates: Partial<AppState['preferences']>) => void;
}

const initialDraftDeck = {
  title: '',
  description: '',
  visibility: 'private' as const,
  subjects: [],
  gradeBands: [],
};

const initialPreferences = {
  autoPlayVideos: true,
  showHints: true,
  quizDifficulty: 'medium' as const,
  notificationsEnabled: true,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme
      isDarkMode: false,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      
      // Draft deck state
      draftDeck: initialDraftDeck,
      updateDraftDeck: (updates) => 
        set((state) => ({ 
          draftDeck: { ...state.draftDeck, ...updates } 
        })),
      clearDraftDeck: () => set({ draftDeck: initialDraftDeck }),
      
      // UI state
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),
      
      // Notifications
      notifications: [],
      addNotification: (notification) => {
        const id = Math.random().toString(36).substring(2, 9);
        const timestamp = Date.now();
        set((state) => ({
          notifications: [
            { ...notification, id, timestamp },
            ...state.notifications,
          ].slice(0, 10), // Keep only last 10 notifications
        }));
      },
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearNotifications: () => set({ notifications: [] }),
      
      // User preferences
      preferences: initialPreferences,
      updatePreferences: (updates) =>
        set((state) => ({
          preferences: { ...state.preferences, ...updates },
        })),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        preferences: state.preferences,
      }),
    }
  )
);
