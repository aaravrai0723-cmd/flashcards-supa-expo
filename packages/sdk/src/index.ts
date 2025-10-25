// Main exports for the flashcards SDK

// Client and auth
export { 
  getSupabaseClient, 
  createSupabaseClient, 
  getCurrentUser, 
  signOut, 
  getCurrentSession,
  supabase 
} from './client';

// Repository instances
export { decksRepo } from './repos/decks';
export { cardsRepo } from './repos/cards';
export { mediaRepo } from './repos/media';
export { jobsRepo } from './repos/jobs';

// Repository classes (for custom instances)
export { DecksRepository } from './repos/decks';
export { CardsRepository } from './repos/cards';
export { MediaRepository } from './repos/media';
export { JobsRepository } from './repos/jobs';

// Types
export type { Database, Tables, Enums } from './client';
export type { Json } from './types/database';

// Utility functions
export const { enqueueIngestJob } = jobsRepo;
