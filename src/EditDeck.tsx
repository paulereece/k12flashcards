import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// import { getCardsForDeck, uploadCards, getDecks } from './supabasehelpers';
// import { supabase } from './supabaseClient';
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
      // TODO: Fetch deck name from Neon/Postgres
      // TODO: Fetch cards from Neon/Postgres
      setLoading(false);
    }
    if (deckId) fetchDeckAndCards();
  }, [deckId]);

  const handleAddCard = async () => {
    if (!questionInput.trim() || !answerInput.trim()) return;
    setSaving(true);
    // TODO: Add card to Neon/Postgres
    setSaving(false);
  };

  // Delete a card
  const handleDeleteCard = async (idx: number) => {
    if (!window.confirm('Delete this card?')) return;
    // TODO: Delete card from Neon/Postgres
  };

  // Start editing a card
  const handleEditCard = (idx: number) => {
    setEditingIdx(idx);
    setEditQuestion(cards[idx].question);
    setEditAnswer(cards[idx].answer);
  };

  // Save edited card
  const handleSaveEdit = async (idx: number) => {
    // TODO: Update card in Neon/Postgres
    setEditingIdx(null);
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
        // TODO: Upload cards to Neon/Postgres
      }
    });
  };

  // Save new deck name
  const handleSaveDeckName = async () => {
    if (!deckId || !newDeckName.trim()) return;
    // TODO: Update deck name in Neon/Postgres
    setDeckName(newDeckName.trim());
    setEditingName(false);
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Edit Deck</h2>
      <div style={{ marginBottom: '1rem' }}>
        {editingName ? (
          <>
            <input
              type="text"
              value={newDeckName}
              onChange={e => setNewDeckName(e.target.value)}
            />
            <button onClick={handleSaveDeckName}>Save</button>
            <button onClick={() => setEditingName(false)}>Cancel</button>
          </>
        ) : (
          <>
            <span style={{ fontWeight: 600, fontSize: '1.2rem' }}>{deckName}</span>
            <button onClick={() => setEditingName(true)} style={{ marginLeft: '1rem' }}>Rename</button>
          </>
        )}
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Question"
          value={questionInput}
          onChange={e => setQuestionInput(e.target.value)}
        />
        <input
          type="text"
          placeholder="Answer"
          value={answerInput}
          onChange={e => setAnswerInput(e.target.value)}
        />
        <button onClick={handleAddCard} disabled={saving}>Add Card</button>
      </div>
      <input type="file" accept=".csv" onChange={handleUploadCSV} />
      <table style={{ width: '100%', marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Question</th>
            <th>Answer</th>
            <th>Edit</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {cards.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>No cards yet.</td>
            </tr>
          ) : (
            cards.map((card, idx) => (
              <tr key={idx}>
                <td>
                  {editingIdx === idx ? (
                    <input
                      type="text"
                      value={editQuestion}
                      onChange={e => setEditQuestion(e.target.value)}
                    />
                  ) : (
                    card.question
                  )}
                </td>
                <td>
                  {editingIdx === idx ? (
                    <input
                      type="text"
                      value={editAnswer}
                      onChange={e => setEditAnswer(e.target.value)}
                    />
                  ) : (
                    card.answer
                  )}
                </td>
                <td>
                  {editingIdx === idx ? (
                    <>
                      <button onClick={() => handleSaveEdit(idx)}>Save</button>
                      <button onClick={handleCancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => handleEditCard(idx)}>Edit</button>
                  )}
                </td>
                <td>
                  <button onClick={() => handleDeleteCard(idx)}>Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <button onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>Back</button>
    </div>
  );
};

export default EditDeck; 