import { getSupabaseClient } from '../client';
import type { Tables, Database } from '../types/database';

type Card = Tables<'cards'>;
type CardInsert = Database['public']['Tables']['cards']['Insert'];
type CardUpdate = Database['public']['Tables']['cards']['Update'];
type CardRegion = Tables<'card_regions'>;
type CardRegionInsert = Database['public']['Tables']['card_regions']['Insert'];

export class CardsRepository {
  private client = getSupabaseClient();

  /**
   * Get all cards for a deck
   */
  async getCardsByDeck(deckId: number): Promise<Card[]> {
    const { data, error } = await this.client
      .from('cards')
      .select('*')
      .eq('deck_id', deckId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch cards: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single card by ID
   */
  async getCardById(id: number): Promise<Card | null> {
    const { data, error } = await this.client
      .from('cards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Card not found
      }
      throw new Error(`Failed to fetch card: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new card
   */
  async createCard(card: CardInsert): Promise<Card> {
    const { data, error } = await this.client
      .from('cards')
      .insert(card)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create card: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a card
   */
  async updateCard(id: number, updates: CardUpdate): Promise<Card> {
    const { data, error } = await this.client
      .from('cards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update card: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a card (soft delete by setting is_active to false)
   */
  async deleteCard(id: number): Promise<void> {
    const { error } = await this.client
      .from('cards')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete card: ${error.message}`);
    }
  }

  /**
   * Hard delete a card
   */
  async hardDeleteCard(id: number): Promise<void> {
    const { error } = await this.client
      .from('cards')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to hard delete card: ${error.message}`);
    }
  }

  /**
   * Get card with all relationships and media
   */
  async getCardWithRelations(id: number) {
    const { data, error } = await this.client
      .from('cards')
      .select(`
        *,
        card_media(
          media_assets(*),
          role,
          sort_order
        ),
        card_topics(topics(*)),
        card_tags(tags(*)),
        card_standards(standards(*)),
        card_regions(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch card with relations: ${error.message}`);
    }

    return data;
  }

  /**
   * Add media to a card
   */
  async addMediaToCard(cardId: number, mediaAssetId: number, role = 'primary', sortOrder = 0): Promise<void> {
    const { error } = await this.client
      .from('card_media')
      .insert({
        card_id: cardId,
        media_asset_id: mediaAssetId,
        role,
        sort_order: sortOrder,
      });

    if (error) {
      throw new Error(`Failed to add media to card: ${error.message}`);
    }
  }

  /**
   * Remove media from a card
   */
  async removeMediaFromCard(cardId: number, mediaAssetId: number): Promise<void> {
    const { error } = await this.client
      .from('card_media')
      .delete()
      .eq('card_id', cardId)
      .eq('media_asset_id', mediaAssetId);

    if (error) {
      throw new Error(`Failed to remove media from card: ${error.message}`);
    }
  }

  /**
   * Add topics to a card
   */
  async addTopicsToCard(cardId: number, topicIds: number[]): Promise<void> {
    const relationships = topicIds.map(topicId => ({
      card_id: cardId,
      topic_id: topicId,
    }));

    const { error } = await this.client
      .from('card_topics')
      .insert(relationships);

    if (error) {
      throw new Error(`Failed to add topics to card: ${error.message}`);
    }
  }

  /**
   * Add tags to a card
   */
  async addTagsToCard(cardId: number, tagIds: number[]): Promise<void> {
    const relationships = tagIds.map(tagId => ({
      card_id: cardId,
      tag_id: tagId,
    }));

    const { error } = await this.client
      .from('card_tags')
      .insert(relationships);

    if (error) {
      throw new Error(`Failed to add tags to card: ${error.message}`);
    }
  }

  /**
   * Add standards to a card
   */
  async addStandardsToCard(cardId: number, standardIds: number[]): Promise<void> {
    const relationships = standardIds.map(standardId => ({
      card_id: cardId,
      standard_id: standardId,
    }));

    const { error } = await this.client
      .from('card_standards')
      .insert(relationships);

    if (error) {
      throw new Error(`Failed to add standards to card: ${error.message}`);
    }
  }

  /**
   * Create a card region (for hotspot/labeling interactions)
   */
  async createCardRegion(region: CardRegionInsert): Promise<CardRegion> {
    const { data, error } = await this.client
      .from('card_regions')
      .insert(region)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create card region: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a card region
   */
  async updateCardRegion(id: number, updates: Partial<CardRegionInsert>): Promise<CardRegion> {
    const { data, error } = await this.client
      .from('card_regions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update card region: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a card region
   */
  async deleteCardRegion(id: number): Promise<void> {
    const { error } = await this.client
      .from('card_regions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete card region: ${error.message}`);
    }
  }

  /**
   * Get card regions for a card
   */
  async getCardRegions(cardId: number): Promise<CardRegion[]> {
    const { data, error } = await this.client
      .from('card_regions')
      .select('*')
      .eq('card_id', cardId)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch card regions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Search cards by prompt or answer text
   */
  async searchCards(query: string, deckId?: number, limit = 20): Promise<Card[]> {
    let queryBuilder = this.client
      .from('cards')
      .select('*')
      .or(`prompt_text.ilike.%${query}%,answer_text.ilike.%${query}%,title.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(limit);

    if (deckId) {
      queryBuilder = queryBuilder.eq('deck_id', deckId);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to search cards: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get cards by difficulty level
   */
  async getCardsByDifficulty(deckId: number, difficulty: 'beginner' | 'intermediate' | 'advanced'): Promise<Card[]> {
    const { data, error } = await this.client
      .from('cards')
      .select('*')
      .eq('deck_id', deckId)
      .eq('difficulty', difficulty)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch cards by difficulty: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get cards by Bloom's taxonomy level
   */
  async getCardsByBloomLevel(deckId: number, bloomLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'): Promise<Card[]> {
    const { data, error } = await this.client
      .from('cards')
      .select('*')
      .eq('deck_id', deckId)
      .eq('bloom_level', bloomLevel)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch cards by Bloom level: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Duplicate a card
   */
  async duplicateCard(cardId: number, newDeckId?: number): Promise<Card> {
    // First get the original card
    const originalCard = await this.getCardById(cardId);
    if (!originalCard) {
      throw new Error('Card not found');
    }

    // Create a new card based on the original
    const newCard: CardInsert = {
      deck_id: newDeckId || originalCard.deck_id,
      title: originalCard.title ? `${originalCard.title} (Copy)` : null,
      prompt_text: originalCard.prompt_text,
      answer_text: originalCard.answer_text,
      bloom_level: originalCard.bloom_level,
      learning_objective: originalCard.learning_objective,
      difficulty: originalCard.difficulty,
      language_code: originalCard.language_code,
      age_min: originalCard.age_min,
      age_max: originalCard.age_max,
      is_active: true,
    };

    return this.createCard(newCard);
  }
}

// Export singleton instance
export const cardsRepo = new CardsRepository();
