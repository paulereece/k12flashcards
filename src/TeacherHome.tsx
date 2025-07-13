import React, { useEffect, useState } from 'react';
import { getDecks, createDeck, uploadCards, deleteDeck } from './supabasehelpers';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from './TeacherLayout';
import { supabase } from './supabaseClient';

type Deck = {
  id: string;
  name: string;
  created_at: string;
};

function TeacherHome() {
  const [decks, setDecks] = useState<Deck[]>([]);


  const [loading, setLoading] = useState(true);
  const [addCardModal, setAddCardModal] = useState<{ open: boolean; deckId: string | null }>({ open: false, deckId: null });
  const [newCards, setNewCards] = useState<{ question: string; answer: string }[]>([]);
  const [questionInput, setQuestionInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [assigningDeckId, setAssigningDeckId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate('/login');
      } else {
        setLoading(false);
      }
    }
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    async function fetchDecks() {
      const data = await getDecks();
      if (data.length > 0) setDecks(data);
    }

    if (!loading) {
      fetchDecks();
    }
  }, [loading]);

  useEffect(() => {
    async function fetchClasses() {
      const { data, error } = await supabase.from('classes').select('*');
      if (!error && data) setClasses(data);
    }
    fetchClasses();
  }, []);

  const handleNewDeck = async () => {
    const title = prompt("Enter a title for the new deck:");
    if (!title) return;

    // Get the current teacher's id
    const { data: userData } = await supabase.auth.getUser();
    const teacherId = userData?.user?.id;
    if (!teacherId) {
      alert("Could not determine teacher id. Please log in again.");
      return;
    }

    const { data, error } = await createDeck(title, teacherId);
    if (error) {
      console.error("Error creating deck:", error.message);
      alert("Could not create deck.");
    } else {
      setDecks((prev) => [...prev, data]);
    }
  };



  const handleDeleteDeck = async (deckId: string) => {
    if (!window.confirm('Are you sure you want to delete this deck? This cannot be undone.')) return;
    const { error } = await deleteDeck(deckId);
    if (error) {
      alert('Error deleting deck.');
    } else {
      setDecks((prev) => prev.filter((deck) => deck.id !== deckId));
    }
  };

  const handleAssignDeck = async (deckId: string, classId: string) => {
    if (!classId) return;
    // Get current teacher's id
    const { data: userData } = await supabase.auth.getUser();
    const teacherId = userData?.user?.id;
    if (!teacherId) {
      alert('Could not determine teacher id. Please log in again.');
      return;
    }
    const { error } = await supabase.from('assignments').insert({ deck_id: deckId, class_id: classId, teacher_id: teacherId });
    if (error) {
      alert('Error assigning deck.');
    } else {
      alert('Deck assigned!');
      setAssigningDeckId(null);
      setSelectedClassId('');
    }
  };



  const handleAddCardToList = () => {
    if (!questionInput.trim() || !answerInput.trim()) return;
    setNewCards((prev) => [...prev, { question: questionInput.trim(), answer: answerInput.trim() }]);
    setQuestionInput('');
    setAnswerInput('');
  };

  const handleRemoveNewCard = (idx: number) => {
    setNewCards((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveNewCards = async () => {
    if (!addCardModal.deckId || newCards.length === 0) return;
    const cardsToUpload = newCards.map(card => ({ ...card, deck_id: addCardModal.deckId! }));
    const { error } = await uploadCards(cardsToUpload);
    if (error) {
      alert('Error saving cards.');
    } else {
      alert('Cards added!');
      setAddCardModal({ open: false, deckId: null });
      setNewCards([]);
    }
  };

  if (loading) return null;

  return (
    <TeacherLayout>
      <h1 style={styles.title}>My Decks</h1>

      <button onClick={handleNewDeck} style={styles.newDeckButton}>
        New Deck
      </button>

      {decks.map((deck) => (
        <div key={deck.id} style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <strong>{deck.name}</strong>
              <p style={{ fontSize: '0.8rem', color: '#666' }}>
                Created: {new Date(deck.created_at).toLocaleDateString()}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button style={styles.practiceButton} onClick={() => navigate(`/study/${deck.id}`)}>
                Practice
              </button>
              <button style={styles.addCardButton} onClick={() => navigate(`/decks/${deck.id}/edit`)}>
                Edit Deck
              </button>
              <button style={styles.deleteButton} onClick={() => handleDeleteDeck(deck.id)}>
                Delete
              </button>
              <button style={styles.assignButton} onClick={() => setAssigningDeckId(deck.id)}>
                Assign Deck
              </button>
              {assigningDeckId === deck.id && (
                <select
                  style={styles.classDropdown}
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                >
                  <option value="">Select class...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
              {assigningDeckId === deck.id && selectedClassId && (
                <button style={styles.confirmAssignButton} onClick={() => handleAssignDeck(deck.id, selectedClassId)}>
                  Confirm
                </button>
              )}
              {assigningDeckId === deck.id && (
                <button style={styles.cancelAssignButton} onClick={() => { setAssigningDeckId(null); setSelectedClassId(''); }}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      ))}



      {addCardModal.open && (
        <div style={styles.modalOverlay}>
          <div style={styles.addCardModalBox}>
            <h2 style={{ marginBottom: '1rem', fontWeight: 700 }}>Add Cards</h2>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Question"
                value={questionInput}
                onChange={e => setQuestionInput(e.target.value)}
                style={styles.addCardInput}
              />
              <input
                type="text"
                placeholder="Answer"
                value={answerInput}
                onChange={e => setAnswerInput(e.target.value)}
                style={styles.addCardInput}
              />
              <button onClick={handleAddCardToList} style={styles.addCardToListButton}>Add</button>
            </div>
            <ul style={{ maxHeight: '120px', overflowY: 'auto', marginBottom: '1rem', padding: 0 }}>
              {newCards.map((card, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', listStyle: 'none' }}>
                  <span><strong>Q:</strong> {card.question} <strong>A:</strong> {card.answer}</span>
                  <button onClick={() => handleRemoveNewCard(idx)} style={styles.removeCardButton}>Remove</button>
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={handleSaveNewCards} style={styles.saveNewCardsButton}>Save All</button>
              <button onClick={() => setAddCardModal({ open: false, deckId: null })} style={styles.cancelModalButton}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  title: {
    fontSize: '2rem',
    marginBottom: '1rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 0 5px rgba(0,0,0,0.1)',
    marginBottom: '1rem',
  },
  newDeckButton: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '1.5rem',
    border: 'none',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uploadCardButton: {
    backgroundColor: '#6f42c1',
    color: 'white',
    padding: '8px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  viewCardButton: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '8px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    border: 'none',
  },
  practiceButton: {
    backgroundColor: '#ffc107',
    color: 'black',
    padding: '8px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    border: 'none',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '8px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    border: 'none',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '10px',
    maxHeight: '80vh',
    overflowY: 'auto',
    width: '400px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
  },
  closeModalButton: {
    marginTop: '1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '8px 14px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  addCardButton: {
    backgroundColor: '#17a2b8',
    color: 'white',
    padding: '8px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    border: 'none',
  },
  addCardModalBox: {
    backgroundColor: 'white',
    borderRadius: '14px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
    padding: '2rem 2.5rem',
    maxWidth: '420px',
    width: '100%',
    margin: 'auto',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  addCardInput: {
    flex: 1,
    padding: '8px',
    fontSize: '1rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    minWidth: '0',
  },
  addCardToListButton: {
    backgroundColor: '#17a2b8',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 14px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    height: '38px',
    alignSelf: 'center',
    transition: 'background 0.2s',
  },
  saveNewCardsButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 18px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    transition: 'background 0.2s',
  },
  cancelModalButton: {
    backgroundColor: '#e0e0e0',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 18px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    transition: 'background 0.2s',
  },
  removeCardButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '4px 10px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    transition: 'background 0.2s',
  },
  assignButton: {
    backgroundColor: '#6f42c1',
    color: 'white',
    padding: '8px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    border: 'none',
  },
  classDropdown: {
    padding: '8px 12px',
    fontSize: '1rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    marginLeft: '0.5rem',
  },
  confirmAssignButton: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '8px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    border: 'none',
    marginLeft: '0.5rem',
  },
  cancelAssignButton: {
    backgroundColor: '#e0e0e0',
    color: '#333',
    padding: '8px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    border: 'none',
    marginLeft: '0.5rem',
  },
};

export default TeacherHome;
