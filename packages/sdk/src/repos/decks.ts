import { getSupabaseClient } from '../client';
import type { Tables, Database } from '../types/database';

type Deck = Tables<'decks'>;
type DeckInsert = Database['public']['Tables']['decks']['Insert'];
type DeckUpdate = Database['public']['Tables']['decks']['Update'];

export class DecksRepository {
  private client = getSupabaseClient();

  /**
   * Get all decks for the current user
   */
  async getMyDecks(): Promise<Deck[]> {
    const { data, error } = await this.client
      .from('decks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch decks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get public decks
   */
  async getPublicDecks(limit = 20, offset = 0): Promise<Deck[]> {
    const { data, error } = await this.client
      .from('decks')
      .select('*')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch public decks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single deck by ID
   */
  async getDeckById(id: number): Promise<Deck | null> {
    const { data, error } = await this.client
      .from('decks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Deck not found
      }
      throw new Error(`Failed to fetch deck: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new deck
   */
  async createDeck(deck: DeckInsert): Promise<Deck> {
    const { data, error } = await this.client
      .from('decks')
      .insert(deck)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create deck: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a deck
   */
  async updateDeck(id: number, updates: DeckUpdate): Promise<Deck> {
    const { data, error } = await this.client
      .from('decks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update deck: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a deck
   */
  async deleteDeck(id: number): Promise<void> {
    const { error } = await this.client
      .from('decks')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete deck: ${error.message}`);
    }
  }

  /**
   * Search decks by title or description
   */
  async searchDecks(query: string, limit = 20): Promise<Deck[]> {
    const { data, error } = await this.client
      .from('decks')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('visibility', 'public')
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search decks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get deck with all relationships
   */
  async getDeckWithRelations(id: number) {
    const { data, error } = await this.client
      .from('decks')
      .select(`
        *,
        deck_subjects(subjects(*)),
        deck_grade_levels(grade_levels(*)),
        deck_topics(topics(*)),
        deck_tags(tags(*)),
        deck_standards(standards(*)),
        cards(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch deck with relations: ${error.message}`);
    }

    return data;
  }

  /**
   * Add subjects to a deck
   */
  async addSubjectsToDeck(deckId: number, subjectIds: number[]): Promise<void> {
    const relationships = subjectIds.map(subjectId => ({
      deck_id: deckId,
      subject_id: subjectId,
    }));

    const { error } = await this.client
      .from('deck_subjects')
      .insert(relationships);

    if (error) {
      throw new Error(`Failed to add subjects to deck: ${error.message}`);
    }
  }

  /**
   * Add grade levels to a deck
   */
  async addGradeLevelsToDeck(deckId: number, gradeLevelIds: number[]): Promise<void> {
    const relationships = gradeLevelIds.map(gradeLevelId => ({
      deck_id: deckId,
      grade_level_id: gradeLevelId,
    }));

    const { error } = await this.client
      .from('deck_grade_levels')
      .insert(relationships);

    if (error) {
      throw new Error(`Failed to add grade levels to deck: ${error.message}`);
    }
  }

  /**
   * Add topics to a deck
   */
  async addTopicsToDeck(deckId: number, topicIds: number[]): Promise<void> {
    const relationships = topicIds.map(topicId => ({
      deck_id: deckId,
      topic_id: topicId,
    }));

    const { error } = await this.client
      .from('deck_topics')
      .insert(relationships);

    if (error) {
      throw new Error(`Failed to add topics to deck: ${error.message}`);
    }
  }

  /**
   * Add tags to a deck
   */
  async addTagsToDeck(deckId: number, tagIds: number[]): Promise<void> {
    const relationships = tagIds.map(tagId => ({
      deck_id: deckId,
      tag_id: tagId,
    }));

    const { error } = await this.client
      .from('deck_tags')
      .insert(relationships);

    if (error) {
      throw new Error(`Failed to add tags to deck: ${error.message}`);
    }
  }

  /**
   * Add standards to a deck
   */
  async addStandardsToDeck(deckId: number, standardIds: number[]): Promise<void> {
    const relationships = standardIds.map(standardId => ({
      deck_id: deckId,
      standard_id: standardId,
    }));

    const { error } = await this.client
      .from('deck_standards')
      .insert(relationships);

    if (error) {
      throw new Error(`Failed to add standards to deck: ${error.message}`);
    }
  }

  /**
   * Remove all relationships for a deck
   */
  async clearDeckRelationships(deckId: number): Promise<void> {
    const { error: subjectsError } = await this.client
      .from('deck_subjects')
      .delete()
      .eq('deck_id', deckId);

    const { error: gradeLevelsError } = await this.client
      .from('deck_grade_levels')
      .delete()
      .eq('deck_id', deckId);

    const { error: topicsError } = await this.client
      .from('deck_topics')
      .delete()
      .eq('deck_id', deckId);

    const { error: tagsError } = await this.client
      .from('deck_tags')
      .delete()
      .eq('deck_id', deckId);

    const { error: standardsError } = await this.client
      .from('deck_standards')
      .delete()
      .eq('deck_id', deckId);

    if (subjectsError || gradeLevelsError || topicsError || tagsError || standardsError) {
      throw new Error('Failed to clear deck relationships');
    }
  }
}

// Export singleton instance
export const decksRepo = new DecksRepository();
