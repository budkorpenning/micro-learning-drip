import { supabase } from './supabase';
import type { Item, ItemInsert } from '@/src/types/database';

/**
 * List items for the current user
 */
export async function listItems(options: { archived: boolean }): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('archived', options.archived)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch items: ${error.message}`);
  }

  return (data ?? []) as Item[];
}

/**
 * Create a new item and its initial schedule entry
 */
export async function createItem(input: ItemInsert): Promise<Item> {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  // Parse tags: split on commas, trim whitespace, remove empty strings
  const tags = input.tags ?? [];
  const parsedTags = Array.isArray(tags)
    ? tags.map(t => t.trim()).filter(t => t.length > 0)
    : [];

  // Create item
  const { data: item, error: itemError } = await supabase
    .from('items')
    .insert({
      user_id: user.id,
      deck_id: input.deck_id,
      title: input.title.trim(),
      content: input.content.trim(),
      source_url: input.source_url?.trim() || null,
      tags: parsedTags,
    } as never)
    .select()
    .single();

  if (itemError) {
    throw new Error(`Failed to create item: ${itemError.message}`);
  }

  const createdItem = item as Item;

  // Create initial schedule entry (due now, interval 1 day)
  const { error: scheduleError } = await supabase
    .from('schedule')
    .insert({
      item_id: createdItem.id,
      user_id: user.id,
      due_at: new Date().toISOString(),
      interval_days: 1,
      // ease_factor uses DB default (2.5)
    } as never);

  if (scheduleError) {
    // If schedule creation fails due to uniqueness constraint, item was still created
    console.error(`Failed to create schedule: ${scheduleError.message}`);

    // If it's a uniqueness violation, that's a bug (shouldn't happen for new items)
    if (scheduleError.code === '23505') {
      throw new Error('Schedule already exists for this item');
    }

    throw new Error(`Failed to create schedule: ${scheduleError.message}`);
  }

  return createdItem;
}

/**
 * Set an item's archived status
 */
export async function setItemArchived(itemId: string, archived: boolean): Promise<void> {
  const { error } = await supabase
    .from('items')
    .update({ archived } as never)
    .eq('id', itemId);

  if (error) {
    throw new Error(`Failed to ${archived ? 'archive' : 'unarchive'} item: ${error.message}`);
  }
}

/**
 * List items for a specific deck
 */
export async function listItemsByDeck(deckId: string, options: { archived: boolean }): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('deck_id', deckId)
    .eq('archived', options.archived)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch items: ${error.message}`);
  }

  return (data ?? []) as Item[];
}
