import React, { useEffect, useState, useRef } from 'react';
// import { getCardsForDeck } from './supabasehelpers';
import { useNavigate, useLocation } from 'react-router-dom';
// import { supabase } from './supabaseClient';

type StudyViewProps = {
  deckId: string;
  mode?: 'preview' | 'assignment' | 'selfstudy';
  spacedRepetition?: boolean;
  userId?: string | null;
};

const StudyView: React.FC<StudyViewProps> = ({ deckId, mode, spacedRepetition, userId }) => {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [answers, setAnswers] = useState<{ correct: boolean }[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const assignmentId = new URLSearchParams(location.search).get('assignmentId');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchCards() {
      setLoading(true);
      // TODO: Fetch cards for this deck from Neon/Postgres
      setLoading(false);
    }
    if (deckId) fetchCards();
  }, [deckId]);

  // TODO: Add handlers for study logic, answer submission, etc.

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Study Deck</h2>
      {/* TODO: Render study UI using cards from Neon/Postgres */}
      {cards.length === 0 ? (
        <p>No cards in this deck.</p>
      ) : (
        <div>
          <p>Card {currentIdx + 1} of {cards.length}</p>
          <div style={{ margin: '1rem 0', fontSize: '1.2rem' }}>
            <strong>Q:</strong> {cards[currentIdx]?.question}
          </div>
          {showAnswer && (
            <div style={{ margin: '1rem 0', fontSize: '1.2rem', color: '#007bff' }}>
              <strong>A:</strong> {cards[currentIdx]?.answer}
            </div>
          )}
          <button onClick={() => setShowAnswer((prev) => !prev)}>
            {showAnswer ? 'Hide Answer' : 'Show Answer'}
          </button>
          {/* TODO: Add answer buttons, next/prev, scoring, etc. */}
        </div>
      )}
      <button onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>Back</button>
    </div>
  );
};

export default StudyView;

