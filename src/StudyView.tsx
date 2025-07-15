import React, { useEffect, useState, useRef } from 'react';
// import { getCardsForDeck } from './supabasehelpers';
import { useNavigate, useLocation } from 'react-router-dom';
// import { supabase } from './supabaseClient';
import { useAuth0 } from '@auth0/auth0-react';

type StudyViewProps = {
  deckId: string;
  mode?: 'preview' | 'assignment' | 'selfstudy';
  spacedRepetition?: boolean;
  userId?: string | null;
};

const StudyView: React.FC<StudyViewProps> = ({ deckId, mode, spacedRepetition, userId }) => {
  type StudyCard = {
    id: string;
    question: string;
    answer: string;
    consecutive_correct: number;
    is_priority: boolean;
    is_complete: boolean;
    times_seen: number;
  };

  const [cards, setCards] = useState<StudyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth0();
  const [sessionUploaded, setSessionUploaded] = useState(false);

  // Fisher-Yates shuffle
  function shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Select next card based on priority and not repeating previous card
  function selectNextCard(cards: StudyCard[], prevId: string | null): StudyCard | null {
    const pending = cards.filter(c => !c.is_complete);
    if (pending.length === 0) return null;
    if (pending.length === 1) return pending[0];
    // Priority cards (recently missed)
    const priority = pending.filter(c => c.is_priority);
    // If the only priority card is the previous card and there are other pending cards, pick randomly from all other pending cards except prevId
    if (priority.length === 1 && priority[0].id === prevId && pending.length > 1) {
      const options = pending.filter(c => c.id !== prevId);
      return options[Math.floor(Math.random() * options.length)];
    }
    let pool = priority.length > 0 ? priority : pending;
    let options = pool.filter(c => c.id !== prevId);
    if (options.length === 0) options = pool; // fallback if all are prevId
    return options[Math.floor(Math.random() * options.length)];
  }

  // Load and shuffle cards on mount
  useEffect(() => {
    async function fetchCards() {
      setLoading(true);
      try {
        const res = await fetch(`/api/decks/${deckId}/cards`);
        if (!res.ok) throw new Error('Failed to fetch cards');
        const data = await res.json();
        let loaded: StudyCard[] = data.map((c: any, i: number) => ({
          id: c.id || String(i),
          question: c.question,
          answer: c.answer,
          consecutive_correct: 0,
          is_priority: false,
          is_complete: false,
          times_seen: 0,
        }));
        loaded = shuffle(loaded);
        setCards(loaded);
        setCompleted(false);
        setUserAnswer('');
        setFeedback('');
        setShowFeedback(false);
        setTotalCorrect(0);
      } catch (err) {
        setCards([]);
        setCurrentCardId(null);
        setCompleted(false);
      } finally {
        setLoading(false);
      }
    }
    if (deckId) {
      setStartTime(Date.now());
      fetchCards();
    }
  }, [deckId]);

  // Set currentCardId after cards are loaded and stable
  useEffect(() => {
    if (cards.length > 0 && currentCardId === null) {
      setCurrentCardId(cards[0].id);
    }
  }, [cards, currentCardId]);

  // Focus input when needed
  useEffect(() => {
    if (!showFeedback && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentCardId, showFeedback]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (!showFeedback && !completed && userAnswer.trim()) {
          checkAnswer();
        } else if (showFeedback && !completed) {
          goNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFeedback, userAnswer, completed, cards, currentCardId]);

  // Get current card object
  const current = cards.find(c => c.id === currentCardId) || null;

  // Check answer logic
  const checkAnswer = () => {
    if (!current) return;
    if (!userAnswer.trim()) return;
    const correct = current.answer.trim().toLowerCase();
    const guess = userAnswer.trim().toLowerCase();
    let updatedCards = cards.map(card => {
      if (card.id !== current.id) return card;
      let cc = card.consecutive_correct;
      let is_priority = card.is_priority;
      let is_complete = card.is_complete;
      let times_seen = card.times_seen + 1;
      if (guess === correct) {
        cc++;
        is_priority = false;
        if (cc >= 3) is_complete = true;
        setTotalCorrect(prev => prev + 1);
      } else {
        cc = 0;
        is_priority = true;
      }
      return { ...card, consecutive_correct: cc, is_priority, is_complete, times_seen };
    });
    setCards(updatedCards);
    if (guess === correct) {
      setFeedback('✅ Correct!');
    } else {
      setFeedback(`❌ Incorrect. Correct answer: ${current.answer}`);
    }
    setShowFeedback(true);
  };

  // Next card logic
  const goNext = () => {
    // Always use up-to-date cards state
    const updatedCards = cards;
    const prevId = currentCardId;
    // Check if all cards are complete
    const allComplete = updatedCards.every(c => c.is_complete);
    if (allComplete) {
      setCompleted(true);
      setCurrentCardId(null);
      setShowFeedback(false);
      setUserAnswer('');
      setFeedback('');
      return;
    }
    // Select next card
    const next = selectNextCard(updatedCards, prevId);
    setCurrentCardId(next?.id || null);
    setShowFeedback(false);
    setUserAnswer('');
    setFeedback('');
  };

  useEffect(() => {
    if (completed && startTime) {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }
  }, [completed, startTime]);

  const completedCount = cards.filter(c => c.is_complete).length;
  const totalCards = cards.length;
  const totalAttempts = cards.reduce((sum, c) => sum + c.times_seen, 0);
  const assignmentId = new URLSearchParams(window.location.search).get('assignmentId');
  const studentId = localStorage.getItem('studentId');
  const percent = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  useEffect(() => {
    if (completed && !sessionUploaded && assignmentId && studentId) {
      // Upload session result
      fetch('/api/study-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          student_id: studentId,
          score_percent: percent,
          time_seconds: elapsedTime,
        }),
      }).then(() => setSessionUploaded(true));
    }
  }, [completed, sessionUploaded, assignmentId, studentId, percent, elapsedTime]);

  return (
    <div style={styles.pageBg}>
      {/* Elegant faint back arrow in top left of screen */}
      <div
        style={styles.backArrow}
        onClick={() => {
          if (isAuthenticated) {
            navigate('/teacher-home', { replace: true });
          } else {
            navigate('/student-dashboard', { replace: true });
          }
        }}
        title="Back to Dashboard"
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ display: 'block' }}>
          <path d="M20 8L12 16L20 24" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={styles.wrapper}>
        {loading ? (
          <p style={styles.emptyMsg}>Loading cards...</p>
        ) : cards.length === 0 ? (
          <p style={styles.emptyMsg}>No cards in this deck.</p>
        ) : completed ? (
          <div style={{ ...styles.completionBox, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 700, marginBottom: '1.2rem' }}>All done!</h2>
            <p style={{ fontSize: '1.15rem', marginBottom: '0.7rem' }}>You got {totalCorrect} out of {totalAttempts} correct! <span style={{ color: '#007bff', fontWeight: 600 }}>({percent}%)</span></p>
            <p style={{ fontSize: '1.08rem', color: '#666', marginBottom: '1.5rem' }}>Time spent: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')} minutes</p>
            <button
              onClick={() => {
                if (isAuthenticated) {
                  navigate('/teacher-home', { replace: true });
                } else {
                  navigate('/student-dashboard', { replace: true });
                }
              }}
              style={{ ...styles.actionButton, marginTop: '2.2rem', width: 220, fontSize: '1.15rem' }}
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div style={styles.cardArea}>
            <div style={styles.question}><strong>Q:</strong> {current?.question}</div>
            {!showFeedback ? (
              <>
                <input
                  ref={inputRef}
                  type="text"
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  style={styles.input}
                  placeholder="Type your answer..."
                  autoFocus
                />
                <div style={styles.buttonRow}>
                  <button onClick={checkAnswer} style={styles.actionButton} disabled={!userAnswer.trim()}>
                    Check
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={styles.feedback}>{feedback}</div>
                <div style={styles.buttonRow}>
                  <button onClick={goNext} style={styles.actionButton}>Next</button>
                </div>
              </>
            )}
          </div>
        )}
        {/* Subtle completed tracker in lower right */}
        {cards.length > 0 && !completed && (
          <div style={styles.tracker}>
            <span>{completedCount} / {totalCards} cards completed</span>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  pageBg: {
    minHeight: '100vh',
    background: '#f6f7f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    padding: '3.5rem 2.5rem',
    maxWidth: '600px',
    width: '90vw',
    background: '#fff',
    borderRadius: '18px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
    position: 'relative',
    minHeight: '340px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardArea: {
    width: '100%',
    textAlign: 'center',
    marginTop: '1.5rem',
  },
  question: {
    fontSize: '2rem',
    marginBottom: '1.5rem',
    fontWeight: 700,
    color: '#222',
  },
  input: {
    padding: '12px',
    fontSize: '1.1rem',
    width: '80%',
    maxWidth: '340px',
    borderRadius: '7px',
    border: '1px solid #ccc',
    marginBottom: '1.2rem',
    outline: 'none',
    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
  },
  buttonRow: {
    display: 'flex',
    gap: '1.2rem',
    justifyContent: 'center',
    marginTop: '1.2rem',
  },
  actionButton: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '7px',
    padding: '12px 28px',
    fontSize: '1.08rem',
    cursor: 'pointer',
    fontWeight: 600,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    transition: 'background 0.2s',
  },
  feedback: {
    fontSize: '1.3rem',
    margin: '1.5rem 0',
    color: '#007bff',
    fontWeight: 600,
  },
  emptyMsg: {
    color: '#888',
    fontSize: '1.1rem',
    margin: '2rem 0',
  },
  completionBox: {
    textAlign: 'center',
    marginTop: '2rem',
  },
  tracker: {
    position: 'absolute',
    bottom: '18px',
    right: '32px',
    fontSize: '0.85rem',
    color: '#bbb',
    background: 'rgba(240,240,240,0.7)',
    borderRadius: '12px',
    padding: '2px 10px',
    fontWeight: 400,
    boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
    letterSpacing: '0.01em',
    zIndex: 2,
  },
  backArrow: {
    position: 'fixed',
    top: 24,
    left: 32,
    zIndex: 10,
    cursor: 'pointer',
    opacity: 0.55,
    transition: 'opacity 0.2s',
    borderRadius: '50%',
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    boxShadow: 'none',
  },
};

export default StudyView;


