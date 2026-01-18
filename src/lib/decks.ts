import { supabase } from './supabase';
import type { Deck, DeckInsert, DeckWithCount } from '@/src/types/database';

/**
 * List all decks for the current user with card counts
 */
export async function listDecks(options?: { archived?: boolean }): Promise<DeckWithCount[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  let query = supabase
    .from('decks')
    .select('*')
    .eq('user_id', user.id);

  if (options?.archived !== undefined) {
    query = query.eq('archived', options.archived);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch decks: ${error.message}`);
  }

  const decks = (data ?? []) as Deck[];
  const deckIds = decks.map((deck) => deck.id);

  const countsByDeck: Record<string, number> = {};
  if (deckIds.length > 0) {
    let itemsQuery = supabase
      .from('items')
      .select('deck_id')
      .in('deck_id', deckIds);

    if (!options?.archived) {
      itemsQuery = itemsQuery.eq('archived', false);
    }

    const { data: items, error: itemsError } = await itemsQuery;

    if (itemsError) {
      throw new Error(`Failed to fetch deck counts: ${itemsError.message}`);
    }

    for (const item of (items ?? []) as { deck_id: string }[]) {
      countsByDeck[item.deck_id] = (countsByDeck[item.deck_id] ?? 0) + 1;
    }
  }

  return decks.map((deck) => ({
    id: deck.id,
    user_id: deck.user_id,
    name: deck.name,
    archived: deck.archived,
    created_at: deck.created_at,
    updated_at: deck.updated_at,
    card_count: countsByDeck[deck.id] ?? 0,
  }));
}

/**
 * Get a single deck by ID
 */
export async function getDeck(deckId: string): Promise<Deck> {
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('id', deckId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch deck: ${error.message}`);
  }

  return data as Deck;
}

/**
 * Create a new deck
 */
export async function createDeck(input: DeckInsert): Promise<Deck> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  const name = input.name.trim();
  if (!name) {
    throw new Error('Deck name is required');
  }

  const { data, error } = await supabase
    .from('decks')
    .insert({
      user_id: user.id,
      name,
    } as never)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('A deck with this name already exists');
    }
    throw new Error(`Failed to create deck: ${error.message}`);
  }

  return data as Deck;
}

/**
 * Delete a deck (cascades to items/schedule/reviews)
 */
export async function deleteDeck(deckId: string): Promise<void> {
  const { error } = await supabase
    .from('decks')
    .delete()
    .eq('id', deckId);

  if (error) {
    throw new Error(`Failed to delete deck: ${error.message}`);
  }
}

/**
 * Set a deck's archived status (and sync all items)
 */
export async function setDeckArchived(deckId: string, archived: boolean): Promise<void> {
  const { error: deckError } = await supabase
    .from('decks')
    .update({ archived } as never)
    .eq('id', deckId);

  if (deckError) {
    throw new Error(`Failed to ${archived ? 'archive' : 'unarchive'} deck: ${deckError.message}`);
  }
}
