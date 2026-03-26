import { useState } from 'react';
import type { TabFilter, PollCategory } from './types';
import { useAuth } from './hooks/useAuth';
import { usePolls } from './hooks/usePolls';
import { Auth } from './components/Auth';
import { PollCard } from './components/PollCard';
import { CreatePollModal } from './components/CreatePollModal';
import { SurveyView } from './components/SurveyView';
import './App.css';

const tabs: TabFilter[] = ['All', 'Homework', 'Research', 'Else'];

function App() {
  const { user, loading: authLoading, signUp, signIn, signInWithGoogle, signOut } = useAuth();
  const { polls, loading: pollsLoading, createPoll, submitResponses } = usePolls();
  const [activeTab, setActiveTab] = useState<TabFilter>('All');
  const [showCreate, setShowCreate] = useState(false);
  const [openPollId, setOpenPollId] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <Auth
        onAuth={async (email, password, isSignUp) => {
          if (isSignUp) return signUp(email, password);
          return signIn(email, password);
        }}
        onGoogleSignIn={signInWithGoogle}
      />
    );
  }

  const filteredPolls =
    activeTab === 'All'
      ? polls
      : polls.filter((p) => p.category === activeTab);

  const openPoll = openPollId ? polls.find((p) => p.id === openPollId) : null;

  const handleVote = async (pollId: string, answers: Record<string, string>, freeTextAnswers: Record<string, string>) => {
    await submitResponses(user.id, pollId, answers, freeTextAnswers);
  };

  const handleCreate = async (data: {
    title: string;
    description: string;
    category: PollCategory;
    questions: { text: string; type: import('./types').QuestionType; options: string[] }[];
  }) => {
    await createPoll(user.id, data);
    setShowCreate(false);
  };

  if (openPoll) {
    return (
      <SurveyView
        poll={openPoll}
        onBack={() => setOpenPollId(null)}
        onVote={handleVote}
      />
    );
  }

  return (
    <>
      <header className="app-header">
        <div className="app-logo">
          <img src={new URL('./assets/better-logo.png', import.meta.url).href} alt="Apollo" className="app-logo-img" />
        </div>
        <div className="header-actions">
          <span className="user-email">{user.email}</span>
          <button className="sign-out-btn" onClick={signOut}>
            Sign Out
          </button>
          <button className="create-btn" onClick={() => setShowCreate(true)}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            New Survey
          </button>
        </div>
      </header>

      <nav className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {pollsLoading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
        </div>
      ) : (
        <div className="polls-grid">
          {filteredPolls.length > 0 ? (
            filteredPolls.map((poll) => (
              <PollCard key={poll.id} poll={poll} onOpen={setOpenPollId} />
            ))
          ) : (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 3v18h18" />
                <path d="M7 16h2v-4H7zM12 16h2V8h-2zM17 16h2v-6h-2z" />
              </svg>
              <p>No surveys in this category yet. Create one!</p>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <CreatePollModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </>
  );
}

export default App;
