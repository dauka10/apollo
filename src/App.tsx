import { useState } from 'react';
import type { TabFilter, PollCategory } from './types';
import { useAuth } from './hooks/useAuth';
import { usePolls } from './hooks/usePolls';
import { useProfile } from './hooks/useProfile';
import { Auth } from './components/Auth';
import { PollCard } from './components/PollCard';
import { CreatePollModal } from './components/CreatePollModal';
import { SurveyView } from './components/SurveyView';
import { ProfileMenu } from './components/ProfileMenu';
import './App.css';

const tabs: TabFilter[] = ['All', 'Homework', 'Research', 'Else'];

function App() {
  const { user, loading: authLoading, signUp, signIn, signInWithGoogle, signOut } = useAuth();
  const { polls, loading: pollsLoading, votedPollIds, createPoll, submitResponses } = usePolls(user?.id);
  const { profile, updateAvatar } = useProfile(user?.id);
  const [activeTab, setActiveTab] = useState<TabFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
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
        onAuth={async (email, password, isSignUp, avatar) => {
          if (isSignUp) {
            const result = await signUp(email, password);
            if (!result.error && avatar) {
              // Profile will be created after email confirmation via onAuthStateChange
              localStorage.setItem('apollo_pending_avatar', avatar);
            }
            return result;
          }
          return signIn(email, password);
        }}
        onGoogleSignIn={signInWithGoogle}
      />
    );
  }

  const query = searchQuery.toLowerCase().trim();
  const filteredPolls = polls.filter((p) => {
    const matchesTab = activeTab === 'All' || p.category === activeTab;
    if (!matchesTab) return false;
    if (!query) return true;
    return (
      p.title.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      (p.authorEmail?.toLowerCase().includes(query) ?? false)
    );
  });

  const openPoll = openPollId ? polls.find((p) => p.id === openPollId) : null;

  const handleVote = async (pollId: string, answers: Record<string, string>, freeTextAnswers: Record<string, string>, otherTextAnswers: Record<string, string>, dynamicAnswers: Record<string, Record<string, number>>, multiAnswers: Record<string, string[]>) => {
    const result = await submitResponses(user.id, pollId, answers, freeTextAnswers, otherTextAnswers, dynamicAnswers, multiAnswers);
    if (result?.error) throw result.error;
  };

  const handleCreate = async (data: {
    title: string;
    description: string;
    category: PollCategory;
    questions: { text: string; type: import('./types').QuestionType; options: string[]; allowOther: boolean; allowMultiple: boolean; maxSelections: number; allowDynamic: boolean }[];
  }) => {
    await createPoll(user.id, user.email ?? '', data);
    setShowCreate(false);
  };

  if (openPoll) {
    return (
      <SurveyView
        poll={openPoll}
        onBack={() => setOpenPollId(null)}
        onVote={handleVote}
        hasVoted={votedPollIds.has(openPoll.id)}
      />
    );
  }

  return (
    <>
      <header className="app-header">
        <div className="app-logo">
          <img src={new URL('./assets/immaculate-logo.png', import.meta.url).href} alt="Apollo" className="app-logo-img" />
        </div>
        <div className="header-actions">
          <button className="create-btn" onClick={() => setShowCreate(true)}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            New Survey
          </button>
          {profile && (
            <ProfileMenu
              profile={profile}
              email={user.email ?? ''}
              onUpdateAvatar={updateAvatar}
              onSignOut={signOut}
            />
          )}
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

      <div className="search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search by title, #hashtag, date..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

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
