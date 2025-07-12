import { supabase } from './supabaseClient';

export async function getDecks() {
  const { data, error } = await supabase.from('decks').select('*');

  if (error) {
    console.error('Error fetching decks:', error.message);
    return [];
  }

  console.log('Fetched decks:', data);
  return data || [];
}

export async function createDeck(title: string, teacher_id: string) {
  const { data, error } = await supabase
    .from('decks')
    .insert([{ name: title, teacher_id }])
    .select()
    .single();

  if (error) {
    console.error("Supabase error:", error);
  }

  return { data, error };
}

export async function uploadCards(cards: { question: string; answer: string; deck_id: string }[]) {
  const { data, error } = await supabase.from('cards').insert(cards);
  if (error) {
    console.error("Error uploading cards:", error.message);
  }
  return { data, error };
}

export async function getCardsForDeck(deckId: string) {
  const { data, error } = await supabase
    .from('cards')
    .select('id, question, answer')
    .eq('deck_id', deckId);

  if (error) {
    console.error("Error fetching cards:", error.message);
  }

  return { data, error };
}

export async function deleteDeck(deckId: string) {
  const { error } = await supabase
    .from('decks')
    .delete()
    .eq('id', deckId);
  if (error) {
    console.error('Error deleting deck:', error.message);
  }
  return { error };
}

export async function getClassIdByCode(code: string) {
  const { data, error } = await supabase
    .from('classes')
    .select('id')
    .eq('code', code)
    .single();
  return { id: data?.id, error };
}





