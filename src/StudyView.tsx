import React, { useEffect, useState, useRef } from 'react';
import { getCardsForDeck } from './supabasehelpers';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';

type StudyViewProps = {
  deckId: string;
  mode?: 'preview' | 'assignment' | 'selfstudy';
  spacedRepetition?: boolean;
  userId?: string | null;
  onComplete?: () => void;
  assignmentId?: string | null;
};

function StudyView(props: StudyViewProps) {
  const {
    deckId,
    onComplete = null,
  } = props;

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
  const [current, setCurrent] = useState<StudyCard | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [sessionStarted, setSessionStarted] = useState<Date | null>(null);
  const [sessionEnded, setSessionEnded] = useState<Date | null>(null);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  // Get assignmentId from props or query string
  const queryAssignmentId = new URLSearchParams(location.search).get('assignmentId');
  const effectiveAssignmentId = props.assignmentId || queryAssignmentId || null;
  const [sessionUploaded, setSessionUploaded] = useState(false);

  // Get userId from props or Supabase auth
  const [userId, setUserId] = useState<string | null>(props.userId || null);
  useEffect(() => {
    if (!userId) {
      supabase.auth.getUser().then(res => setUserId(res.data.user?.id || null));
    }
  }, [userId]);

  const isDone = !current && cards.filter(c => !c.is_complete).length === 0;

  // Fisher-Yates shuffle
  function shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  useEffect(() => {
    async function loadCards() {
      const { data, error } = await getCardsForDeck(deckId);
      if (error || !data) {
        alert("Error loading cards.");
        return;
      }
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
      setCurrent(loaded[0] || null);
      setSessionStarted(new Date());
    }
    loadCards();
  }, [deckId]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (!feedback) {
          checkAnswer();
        } else {
          goNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [feedback, userAnswer, current, cards]);

  useEffect(() => {
    if (isDone && !sessionUploaded && userId) {
      const uploadSession = async () => {
        const total_cards_seen = cards.reduce((sum, c) => sum + c.times_seen, 0);
        const started_at = sessionStarted ? sessionStarted.toISOString() : null;
        const completed_at = new Date().toISOString();
        const total_time_seconds = sessionStarted ? Math.round((new Date().getTime() - sessionStarted.getTime()) / 1000) : null;
        const score_percent = total_cards_seen > 0 ? Math.round((totalCorrect / total_cards_seen) * 100) : 0;
        const { error } = await supabase.from('study_sessions').insert({
          student_id: userId,
          deck_id: deckId,
          assignment_id: effectiveAssignmentId,
          started_at,
          completed_at,
          total_time_seconds,
          total_cards_seen,
          total_correct: totalCorrect,
          score_percent
        });
        if (error) {
          console.error('Error uploading study session:', error.message);
        }
        if (!error) setSessionUploaded(true);
      };
      uploadSession();
    }
  }, [isDone, sessionUploaded, userId, deckId, cards, totalCorrect, sessionStarted, effectiveAssignmentId]);

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

  const checkAnswer = () => {
    if (!current) return;
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
  };

  const goNext = () => {
    if (!current) return;
    setFeedback('');
    setUserAnswer('');
    // Select next card
    const next = selectNextCard(cards, current.id);
    setCurrent(next);
    if (!next && !sessionEnded) setSessionEnded(new Date());
    inputRef.current?.focus();
  };

  const completedCount = cards.filter(c => c.is_complete).length;
  const totalCards = cards.length;

  return (
    <div style={{ position: 'relative' }}>
      {/* Small gray arrow button in top left */}
      <button
        onClick={() => navigate('/student-dashboard')}
        aria-label="Back to Dashboard"
        style={{
          position: 'absolute',
          top: 4,
          left: 40,
          zIndex: 10,
          background: '#e0e0e0',
          color: '#555',
          border: 'none',
          borderRadius: '50%',
          width: 25,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          transition: 'background 0.2s, color 0.2s',
        }}
        onMouseOver={e => {
          e.currentTarget.style.background = '#cccccc';
          e.currentTarget.style.color = '#222';
        }}
        onMouseOut={e => {
          e.currentTarget.style.background = '#e0e0e0';
          e.currentTarget.style.color = '#555';
        }}
      >
        &#8592;
      </button>
      <div style={styles.wrapper}>
        {cards.length === 0 ? (
          <p>Loading cards...</p>
        ) : isDone ? (
          <div>
            <h2>All done!</h2>
            <p>You completed {completedCount} out of {totalCards} cards!</p>
            <div style={{ margin: '2rem 0 1.5rem 0', textAlign: 'left', background: '#f8f9fa', borderRadius: 8, padding: '1.2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <h3 style={{ marginTop: 0 }}>Session Summary</h3>
              <div><strong>Total cards studied:</strong> {totalCards}</div>
              <div><strong>Total questions answered:</strong> {cards.reduce((sum, c) => sum + c.times_seen, 0)}</div>
              <div><strong>Total correct answers:</strong> {totalCorrect} / {cards.reduce((sum, c) => sum + c.times_seen, 0)}</div>
              <div><strong>Score:</strong> {cards.reduce((sum, c) => sum + c.times_seen, 0) > 0 ? Math.round((totalCorrect / cards.reduce((sum, c) => sum + c.times_seen, 0)) * 100) : 0}%</div>
              <div style={{ margin: '1rem 0 0.5rem 0' }}><strong>Cards:</strong></div>
              <ol style={{ paddingLeft: '1.2rem', margin: 0 }}>
                {cards.map(card => (
                  <li key={card.id} style={{ marginBottom: 6 }}>
                    <span style={{ fontWeight: 500 }}>{card.question}</span>
                    <span style={{ color: '#555', marginLeft: 8, fontSize: '0.95em' }}>
                      (Times seen: {card.times_seen})
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <button onClick={() => navigate('/student-dashboard')} style={styles.completeButton}>Back to Home</button>
            {onComplete && (
              <button onClick={onComplete} style={styles.completeButton}>Finish Session</button>
            )}
          </div>
        ) : (
          <div style={styles.cardArea}>
            <h2 style={styles.question}>{current?.question}</h2>
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              style={styles.input}
            />
            <button onClick={checkAnswer} style={styles.checkButton}>Check</button>
            {feedback && (
              <>
                <p>{feedback}</p>
                <button onClick={goNext} style={styles.nextButton}>Next</button>
              </>
            )}
          </div>
        )}

        {!isDone && cards.length > 0 && (
          <div style={styles.tracker}>
            Complete: {completedCount} / {totalCards}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    padding: '2rem',
    maxWidth: '600px',
    margin: 'auto',
    backgroundColor: '#fff3cd',
    borderRadius: '10px',
    boxShadow: '0 0 8px rgba(0,0,0,0.1)',
    marginTop: '3rem',
    position: 'relative',
  },
  cardArea: {
    marginTop: '1.5rem',
    textAlign: 'center',
  },
  question: {
    fontSize: '1.8rem',
    marginBottom: '1rem',
  },
  input: {
    padding: '8px',
    fontSize: '1rem',
    width: '100%',
    marginBottom: '1rem',
  },
  checkButton: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  nextButton: {
    marginTop: '1rem',
    backgroundColor: '#28a745',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  completeButton: {
    marginTop: '1rem',
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  tracker: {
    position: 'absolute',
    bottom: '10px',
    right: '20px',
    fontSize: '0.9rem',
    color: '#555',
  },
};

export default StudyView;

