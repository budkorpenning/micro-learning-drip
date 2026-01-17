import { supabase } from './supabase';
import type { Deck, DeckInsert, DeckWithCount } from '@/src/types/database';

/**
 * List all decks for the current user with card counts
 */
export async function listDecks(): Promise<DeckWithCount[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('decks')
    .select(`
      *,
      items(id)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch decks: ${error.message}`);
  }

  return (data ?? []).map((deck: Record<string, unknown>) => {
    const items = deck.items as { id: string }[] | null;
    return {
      id: deck.id as string,
      user_id: deck.user_id as string,
      name: deck.name as string,
      created_at: deck.created_at as string,
      updated_at: deck.updated_at as string,
      card_count: items?.length ?? 0,
    };
  });
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
