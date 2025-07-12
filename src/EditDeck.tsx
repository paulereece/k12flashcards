import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCardsForDeck, uploadCards, getDecks } from './supabasehelpers';
import { supabase } from './supabaseClient';
import Papa from 'papaparse';

const EditDeck: React.FC = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [deckName, setDeckName] = useState('');
  const [cards, setCards] = useState<{ question: string; answer: string }[]>([]);
  const [questionInput, setQuestionInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');

  useEffect(() => {
    async function fetchDeckAndCards() {
      setLoading(true);
      // Get deck name
      const decks = await getDecks();
      const deck = decks.find((d: any) => d.id === deckId);
      setDeckName(deck ? deck.name : '');
      // Get cards
      const { data, error } = await getCardsForDeck(deckId!);
      if (!error && data) setCards(data);
      setLoading(false);
    }
    if (deckId) fetchDeckAndCards();
  }, [deckId]);

  const handleAddCard = async () => {
    if (!questionInput.trim() || !answerInput.trim()) return;
    setSaving(true);
    const newCard = { question: questionInput.trim(), answer: answerInput.trim(), deck_id: deckId! };
    const { error } = await uploadCards([newCard]);
    if (!error) {
      setCards((prev) => [...prev, { question: newCard.question, answer: newCard.answer }]);
      setQuestionInput('');
      setAnswerInput('');
    } else {
      alert('Error adding card.');
    }
    setSaving(false);
  };

  // Delete a card
  const handleDeleteCard = async (idx: number) => {
    if (!window.confirm('Delete this card?')) return;
    const card = cards[idx];
    // Find card in DB by question, answer, and deck_id
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('deck_id', deckId)
      .eq('question', card.question)
      .eq('answer', card.answer);
    if (!error) {
      setCards(cards.filter((_, i) => i !== idx));
    } else {
      alert('Error deleting card.');
    }
  };

  // Start editing a card
  const handleEditCard = (idx: number) => {
    setEditingIdx(idx);
    setEditQuestion(cards[idx].question);
    setEditAnswer(cards[idx].answer);
  };

  // Save edited card
  const handleSaveEdit = async (idx: number) => {
    const oldCard = cards[idx];
    // Update in DB: find by deck_id, question, answer
    const { error } = await supabase
      .from('cards')
      .update({ question: editQuestion, answer: editAnswer })
      .eq('deck_id', deckId)
      .eq('question', oldCard.question)
      .eq('answer', oldCard.answer);
    if (!error) {
      setCards(cards.map((c, i) => i === idx ? { question: editQuestion, answer: editAnswer } : c));
      setEditingIdx(null);
    } else {
      alert('Error saving card.');
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingIdx(null);
  };

  // Handle CSV upload
  const handleUploadCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !deckId) return;
    Papa.parse(file, {
      complete: async (result: any) => {
        const data = result.data as string[][];
        const cards = data
          .filter(row => row.length === 2 && row[0].trim() && row[1].trim())
          .map(([question, answer]) => ({
            question: question.trim(),
            answer: answer.trim(),
            deck_id: deckId,
          }));
        if (cards.length === 0) {
          alert('No valid cards found in CSV.');
          return;
        }
        const { error } = await uploadCards(cards);
        if (error) {
          alert('Error uploading cards.');
        } else {
          alert('Cards uploaded!');
          // Refresh card list
          const { data: newCards, error: fetchError } = await getCardsForDeck(deckId);
          if (!fetchError && newCards) setCards(newCards);
        }
      }
    });
  };

  // Save new deck name
  const handleSaveDeckName = async () => {
    if (!deckId || !newDeckName.trim()) return;
    const { error } = await supabase
      .from('decks')
      .update({ name: newDeckName.trim() })
      .eq('id', deckId);
    if (!error) {
      setDeckName(newDeckName.trim());
      setEditingName(false);
    } else {
      alert('Error updating deck name.');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div style={styles.wrapper}>
      <button onClick={() => navigate('/teacher-home')} style={styles.backButton}>&larr; Back to Dashboard</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        {editingName ? (
          <>
            <input
              type="text"
              value={newDeckName}
              onChange={e => setNewDeckName(e.target.value)}
              style={styles.deckNameInput}
            />
            <button onClick={handleSaveDeckName} style={styles.saveEditButton}>Save</button>
            <button onClick={() => setEditingName(false)} style={styles.cancelEditButton}>Cancel</button>
          </>
        ) : (
          <>
            <h1 style={styles.title}>Edit Deck: {deckName}</h1>
            <button onClick={() => { setEditingName(true); setNewDeckName(deckName); }} style={styles.editButton}>Edit</button>
          </>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button style={styles.uploadCardButton}>
          Upload Cards
          <input
            type="file"
            accept=".csv"
            hidden
            onChange={handleUploadCSV}
          />
        </button>
        <span style={{ color: '#888', fontSize: '0.95rem' }}>(CSV: question,answer per row)</span>
      </div>
      <div style={styles.addCardSection}>
        <textarea
          placeholder="Question"
          value={questionInput}
          onChange={e => setQuestionInput(e.target.value)}
          style={styles.textarea}
          rows={2}
        />
        <textarea
          placeholder="Answer"
          value={answerInput}
          onChange={e => setAnswerInput(e.target.value)}
          style={styles.textarea}
          rows={2}
        />
        <button onClick={handleAddCard} style={styles.addButton} disabled={saving}>
          {saving ? 'Adding...' : 'Add Card'}
        </button>
      </div>
      <h2 style={styles.cardsTitle}>Cards in this Deck</h2>
      <ul style={styles.cardList}>
        {cards.map((card, idx) => (
          <li key={idx} style={styles.cardRow}>
            {editingIdx === idx ? (
              <>
                <textarea
                  value={editQuestion}
                  onChange={e => setEditQuestion(e.target.value)}
                  style={styles.cardTextarea}
                  rows={2}
                />
                <textarea
                  value={editAnswer}
                  onChange={e => setEditAnswer(e.target.value)}
                  style={styles.cardTextarea}
                  rows={2}
                />
                <button onClick={() => handleSaveEdit(idx)} style={styles.saveEditButton}>Save</button>
                <button onClick={handleCancelEdit} style={styles.cancelEditButton}>Cancel</button>
              </>
            ) : (
              <>
                <div style={styles.cardQ}><strong>Q:</strong> {card.question}</div>
                <div style={styles.cardA}><strong>A:</strong> {card.answer}</div>
                <button onClick={() => handleEditCard(idx)} style={styles.editButton}>Edit</button>
                <button onClick={() => handleDeleteCard(idx)} style={styles.deleteButton}>Delete</button>
              </>
            )}
          </li>
        ))}
        {cards.length === 0 && <li style={{ color: '#888' }}>No cards yet.</li>}
      </ul>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    maxWidth: '700px',
    margin: '2rem auto',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
    padding: '2rem',
  },
  backButton: {
    marginBottom: '1rem',
    background: 'none',
    border: 'none',
    color: '#007bff',
    fontSize: '1rem',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '1.5rem',
  },
  addCardSection: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    alignItems: 'flex-start',
  },
  textarea: {
    flex: 1,
    padding: '10px',
    fontSize: '1rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    resize: 'vertical',
    minHeight: '40px',
  },
  addButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 18px',
    cursor: 'pointer',
    fontSize: '1rem',
    alignSelf: 'center',
    minWidth: '100px',
  },
  cardsTitle: {
    fontSize: '1.3rem',
    marginBottom: '1rem',
  },
  cardList: {
    listStyle: 'none',
    padding: 0,
    maxHeight: '350px',
    overflowY: 'auto',
    border: '1px solid #eee',
    borderRadius: '8px',
    background: '#fafbfc',
  },
  cardRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #eee',
    marginBottom: 0,
  },
  cardQ: {
    flex: 1,
    minWidth: 0,
    wordBreak: 'break-word',
  },
  cardA: {
    flex: 1,
    minWidth: 0,
    wordBreak: 'break-word',
  },
  cardTextarea: {
    flex: 1,
    minWidth: 0,
    padding: '8px',
    fontSize: '1rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    resize: 'vertical',
  },
  editButton: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    marginRight: '0.5rem',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  saveEditButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    marginRight: '0.5rem',
  },
  cancelEditButton: {
    backgroundColor: '#e0e0e0',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  uploadCardButton: {
    backgroundColor: '#6f42c1',
    color: 'white',
    padding: '8px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    border: 'none',
    position: 'relative',
    overflow: 'hidden',
    display: 'inline-block',
  },
  deckNameInput: {
    fontSize: '1.5rem',
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    marginRight: '0.5rem',
    minWidth: '200px',
  },
};

export default EditDeck; 