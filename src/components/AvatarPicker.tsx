import { AVATAR_OPTIONS, type AvatarId } from '../hooks/useProfile';
import './AvatarPicker.css';

// Import all avatar images
const avatarImages = import.meta.glob('../assets/avatars/*.png', { eager: true, import: 'default' }) as Record<string, string>;

function getAvatarSrc(id: string): string | undefined {
  const key = Object.keys(avatarImages).find((k) => k.includes(id));
  return key ? avatarImages[key] : undefined;
}

interface AvatarPickerProps {
  selected: string;
  onSelect: (id: AvatarId) => void;
}

export function AvatarPicker({ selected, onSelect }: AvatarPickerProps) {
  return (
    <div className="avatar-picker">
      <p className="avatar-picker-label">Choose your avatar</p>
      <div className="avatar-picker-grid">
        {AVATAR_OPTIONS.map((id) => {
          const src = getAvatarSrc(id);
          return (
            <button
              key={id}
              className={`avatar-picker-item ${selected === id ? 'selected' : ''}`}
              onClick={() => onSelect(id)}
              type="button"
            >
              {src ? (
                <img src={src} alt={id} />
              ) : (
                <div className="avatar-picker-placeholder">{id.slice(-1)}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AvatarDisplay({ avatarId, size = 24 }: { avatarId: string; size?: number }) {
  const src = getAvatarSrc(avatarId);
  if (src) {
    return <img src={src} alt="avatar" className="avatar-display" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="avatar-display avatar-fallback"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      ?
    </div>
  );
}
