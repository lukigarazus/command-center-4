import { useState, useEffect } from 'react';
import { useStorage } from '../../shared/contexts/StorageContext';
import { Friend } from './types';
import { FriendCard } from './FriendCard';
import { FriendForm } from './FriendForm';

export default function FriendsApp() {
  const storage = useStorage();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Load friends from storage
  useEffect(() => {
    const loadFriends = async () => {
      const stored = await storage.getItem('friends');
      if (stored) {
        try {
          setFriends(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse friends:', e);
        }
      }
    };
    loadFriends();
  }, [storage]);

  // Save friends to storage
  const saveFriends = async (updatedFriends: Friend[]) => {
    setFriends(updatedFriends);
    await storage.setItem('friends', JSON.stringify(updatedFriends));
  };

  const handleAddFriend = async (friend: Omit<Friend, 'id'>) => {
    const newFriend: Friend = {
      ...friend,
      id: Date.now().toString(),
    };
    await saveFriends([...friends, newFriend]);
    setIsFormOpen(false);
  };

  const handleEditFriend = async (friend: Friend) => {
    const updatedFriends = friends.map((f) => (f.id === friend.id ? friend : f));
    await saveFriends(updatedFriends);
    setEditingFriend(null);
  };

  const handleDeleteFriend = async (id: string) => {
    const updatedFriends = friends.filter((f) => f.id !== id);
    await saveFriends(updatedFriends);
  };

  const openEditForm = (friend: Friend) => {
    setEditingFriend(friend);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingFriend(null);
  };

  // Get all unique tags
  const allTags = Array.from(new Set(friends.flatMap((f) => f.tags))).sort();

  // Filter friends
  const filteredFriends = friends.filter((friend) => {
    const matchesSearch = friend.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags =
      selectedTags.length === 0 || selectedTags.every((tag) => friend.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="min-h-screen bg-primary p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-primary">Friends</h1>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-semibold"
          >
            Add Friend
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-surface rounded-lg shadow p-4 mb-6 border border-primary">
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-primary border border-primary rounded-lg text-primary placeholder-secondary mb-4"
          />

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-accent text-white'
                      : 'bg-primary text-secondary border border-primary hover:bg-surface-hover'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Friends Grid */}
        {filteredFriends.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-secondary text-lg">
              {friends.length === 0 ? 'No friends yet. Add your first friend!' : 'No friends match your filters.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFriends.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                onEdit={() => openEditForm(friend)}
                onDelete={() => handleDeleteFriend(friend.id)}
              />
            ))}
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {(isFormOpen || editingFriend) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-surface rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-primary">
              <FriendForm
                friend={editingFriend || undefined}
                onSave={editingFriend ? handleEditFriend : handleAddFriend}
                onCancel={closeForm}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
