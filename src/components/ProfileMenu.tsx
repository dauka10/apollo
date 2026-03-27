import { useState, useRef, useEffect } from 'react';
import { AvatarDisplay, AvatarPicker } from './AvatarPicker';
import type { AvatarId } from '../hooks/useProfile';
import type { Profile } from '../hooks/useProfile';
import './ProfileMenu.css';

interface ProfileMenuProps {
  profile: Profile;
  email: string;
  onUpdateAvatar: (avatar: string) => Promise<{ error: unknown } | undefined>;
  onSignOut: () => void;
}

export function ProfileMenu({ profile, email, onUpdateAvatar, onSignOut }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="profile-menu" ref={menuRef}>
      <button className="profile-menu-trigger" onClick={() => setOpen(!open)}>
        <AvatarDisplay avatarId={profile.avatar} size={56} />
      </button>

      {open && (
        <div className="profile-menu-dropdown">
          <div className="profile-menu-header">
            <AvatarDisplay avatarId={profile.avatar} size={64} />
            <div className="profile-menu-info">
              <span className="profile-menu-email">{email}</span>
            </div>
          </div>

          {editing ? (
            <div className="profile-menu-edit">
              <AvatarPicker
                selected={profile.avatar}
                onSelect={async (id: AvatarId) => {
                  await onUpdateAvatar(id);
                  setEditing(false);
                }}
              />
            </div>
          ) : (
            <div className="profile-menu-actions">
              <button onClick={() => setEditing(true)}>Change Avatar</button>
              <button onClick={onSignOut}>Sign Out</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
