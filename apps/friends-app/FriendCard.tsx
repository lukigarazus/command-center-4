import { useState, useEffect } from 'react';
import { Friend } from './types';
import { Heatmap } from '../../shared/components/Heatmap';
import { useImageService } from '../../shared/contexts/ImageContext';

interface FriendCardProps {
  friend: Friend;
  onEdit: () => void;
  onDelete: () => void;
}

export const FriendCard = ({ friend, onEdit, onDelete }: FriendCardProps) => {
  const imageService = useImageService();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadAvatar = async () => {
      if (friend.avatarImage) {
        try {
          const data = await imageService.getImage(friend.avatarImage);
          const blob = new Blob([data], { type: 'image/png' });
          const url = URL.createObjectURL(blob);
          setAvatarUrl(url);
        } catch (e) {
          console.error('Failed to load avatar:', e);
        }
      }
    };
    loadAvatar();

    return () => {
      if (avatarUrl) {
        URL.revokeObjectURL(avatarUrl);
      }
    };
  }, [friend.avatarImage, imageService]);

  const now = new Date();

  const pastMeetings = friend.meetings.filter((m) => new Date(m.date) < now);
  const futureMeetings = friend.meetings.filter((m) => new Date(m.date) >= now);

  const upcomingMeeting = futureMeetings
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const daysSinceLastMeeting = () => {
    if (pastMeetings.length === 0) return null;
    const lastMeeting = pastMeetings
      .map((m) => new Date(m.date))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    const days = Math.floor((Date.now() - lastMeeting.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const daysUntilBirthday = () => {
    if (!friend.birthday) return null;
    const today = new Date();
    const birthday = new Date(friend.birthday);
    const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());

    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1);
    }

    const days = Math.floor((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const lastMeetingDays = daysSinceLastMeeting();
  const birthdayDays = daysUntilBirthday();

  return (
    <div className="bg-surface rounded-lg shadow p-4 border border-primary hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent text-2xl font-bold overflow-hidden flex-shrink-0 border-2 border-primary/20">
          {avatarUrl ? (
            <img src={avatarUrl} alt={friend.name} className="w-full h-full object-cover" />
          ) : (
            friend.name.charAt(0).toUpperCase()
          )}
        </div>

        {/* Name and Actions */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-primary mb-1 truncate">{friend.name}</h3>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="text-sm text-accent hover:opacity-80 transition-opacity"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="text-sm text-error hover:opacity-80 transition-opacity font-semibold"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tags */}
      {friend.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {friend.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-accent/20 text-accent text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="space-y-2 mb-3 text-sm">
        {lastMeetingDays !== null && (
          <p className="text-secondary">
            Last met: <span className="text-primary font-semibold">{lastMeetingDays} days ago</span>
          </p>
        )}
        {birthdayDays !== null && (
          <p className="text-secondary">
            Birthday: <span className="text-primary font-semibold">in {birthdayDays} days</span>
          </p>
        )}
        {upcomingMeeting && (
          <p className="text-secondary">
            Next meeting: <span className="text-primary font-semibold">
              {new Date(upcomingMeeting.date).toLocaleDateString()}
            </span>
          </p>
        )}
      </div>

      {/* Notes */}
      {friend.notes && (
        <p className="text-secondary text-sm mb-3 line-clamp-3">{friend.notes}</p>
      )}

      {/* Heatmap */}
      {pastMeetings.length > 0 && (
        <div className="mt-4 pt-4 border-t border-primary">
          <p className="text-xs text-secondary mb-2">Meeting History</p>
          <Heatmap data={pastMeetings} />
        </div>
      )}
    </div>
  );
};
