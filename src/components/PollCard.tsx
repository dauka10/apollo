import type { Poll } from '../types';
import { AvatarDisplay } from './AvatarPicker';
import './PollCard.css';

interface PollCardProps {
  poll: Poll;
  onOpen: (pollId: string) => void;
}

function parseDescription(desc: string) {
  const [meta, ...rest] = desc.split('|');
  const metaParts = (meta ?? '').split(/\s+/);
  const tags = metaParts.filter((p) => p.startsWith('#'));
  const date = metaParts.filter((p) => !p.startsWith('#')).join(' ').trim() || undefined;
  const description = rest.join('|').trim() || undefined;
  return { date, tags, description };
}

export function PollCard({ poll, onOpen }: PollCardProps) {
  const categoryClass = poll.category.toLowerCase();
  const { date, tags, description } = parseDescription(poll.description);

  return (
    <div className="poll-card" onClick={() => onOpen(poll.id)}>
      <div className="poll-card-header">
        <span className={`poll-tag ${categoryClass}`}>{poll.category}</span>
        {date && <span className="poll-date">{date}</span>}
      </div>
      {poll.thumbnailUrl && (
        <div className="poll-thumbnail">
          <img src={poll.thumbnailUrl} alt="" />
        </div>
      )}
      <h3 className="poll-title">{poll.title}</h3>
      {tags.length > 0 && (
        <div className="poll-tags">
          {tags.map((tag) => (
            <span key={tag} className="poll-hashtag">{tag}</span>
          ))}
        </div>
      )}
      {description && <p className="poll-description">{description}</p>}
      {poll.authorEmail && (
        <div className="poll-author">
          <AvatarDisplay avatarId={poll.authorAvatar ?? 'default'} size={44} />
          <span className="poll-author-name">{poll.authorEmail}</span>
        </div>
      )}
      <div className="poll-meta">
        <span className="poll-meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
          </svg>
          {poll.questions.length} question{poll.questions.length !== 1 ? 's' : ''}
        </span>
        <span className="poll-meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
          {poll.responses} responses
        </span>
      </div>
    </div>
  );
}
