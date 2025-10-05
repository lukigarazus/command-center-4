import { useState, useRef } from 'react';
import { Friend, Meeting } from './types';
import { useImageService } from '../../shared/contexts/ImageContext';

interface FriendFormProps {
  friend?: Friend;
  onSave: (friend: Friend | Omit<Friend, 'id'>) => void;
  onCancel: () => void;
}

export const FriendForm = ({ friend, onSave, onCancel }: FriendFormProps) => {
  const imageService = useImageService();
  const [name, setName] = useState(friend?.name || '');
  const [tags, setTags] = useState(friend?.tags.join(', ') || '');
  const [notes, setNotes] = useState(friend?.notes || '');
  const [birthday, setBirthday] = useState(friend?.birthday || '');
  const [avatarImage, setAvatarImage] = useState(friend?.avatarImage || '');
  const [meetings, setMeetings] = useState<Meeting[]>(friend?.meetings || []);

  const [newMeetingDate, setNewMeetingDate] = useState('');
  const [newMeetingNotes, setNewMeetingNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const imageName = `avatar-${Date.now()}-${file.name}`;
      await imageService.saveImage(imageName, data);
      setAvatarImage(imageName);
    } catch (err) {
      console.error('Failed to upload avatar:', err);
    }
  };

  const addMeeting = () => {
    if (!newMeetingDate) return;
    setMeetings([...meetings, { date: newMeetingDate, notes: newMeetingNotes }]);
    setNewMeetingDate('');
    setNewMeetingNotes('');
  };

  const removeMeeting = (index: number) => {
    setMeetings(meetings.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const friendData: Friend | Omit<Friend, 'id'> = {
      ...(friend?.id && { id: friend.id }),
      name,
      avatarImage: avatarImage || undefined,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      notes,
      birthday: birthday || undefined,
      meetings: meetings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    };

    onSave(friendData as any);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <h2 className="text-2xl font-bold text-primary mb-6">
        {friend ? 'Edit Friend' : 'Add Friend'}
      </h2>

      {/* Name */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-primary mb-2">Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2 bg-primary border border-primary rounded-lg text-primary"
        />
      </div>

      {/* Avatar */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-primary mb-2">Avatar</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          className="w-full px-4 py-2 bg-primary border border-primary rounded-lg text-primary"
        />
      </div>

      {/* Tags */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-primary mb-2">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="friend, work, family"
          className="w-full px-4 py-2 bg-primary border border-primary rounded-lg text-primary"
        />
      </div>

      {/* Birthday */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-primary mb-2">Birthday</label>
        <input
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          className="w-full px-4 py-2 bg-primary border border-primary rounded-lg text-primary"
        />
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-primary mb-2">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 bg-primary border border-primary rounded-lg text-primary"
        />
      </div>

      {/* Meetings */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-primary mb-2">Meetings</label>
        <div className="space-y-2 mb-2">
          {meetings
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((meeting, index) => {
              const isPast = new Date(meeting.date) < new Date();
              return (
                <div key={index} className="flex items-center gap-2 bg-primary p-2 rounded">
                  <span className="text-primary flex-1">
                    {isPast ? '📅' : '📆'} {new Date(meeting.date).toLocaleDateString()}
                    {meeting.notes && `: ${meeting.notes}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMeeting(index)}
                    className="text-error hover:text-error/80"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={newMeetingDate}
            onChange={(e) => setNewMeetingDate(e.target.value)}
            className="flex-1 px-4 py-2 bg-primary border border-primary rounded-lg text-primary"
          />
          <input
            type="text"
            value={newMeetingNotes}
            onChange={(e) => setNewMeetingNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="flex-1 px-4 py-2 bg-primary border border-primary rounded-lg text-primary"
          />
          <button
            type="button"
            onClick={addMeeting}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
          >
            Add
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-primary border border-primary text-primary rounded-lg hover:bg-surface-hover transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-semibold"
        >
          {friend ? 'Save Changes' : 'Add Friend'}
        </button>
      </div>
    </form>
  );
};
