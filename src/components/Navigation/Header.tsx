import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Plus, Menu, User, Settings, LogOut } from 'lucide-react';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import ThemeSwitcher from '../ui/ThemeSwitcher';
import AddInvoiceModal from '../Invoices/AddInvoiceModal';
import { supabase } from '../../services/api';

interface HeaderProps {
  onToggleSidebar: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          console.error('No authenticated user found');
          return;
        }

        // Get user profile data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          console.error('Error fetching user profile:', userError);
        }

        // Combine auth user data with profile data
        setUserProfile({
          id: user.id,
          email: user.email || '',
          full_name: userData?.full_name || user.user_metadata?.full_name || '',
          avatar_url: userData?.avatar_url || user.user_metadata?.avatar_url || '',
        });
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white border-b border-gray-100 h-16 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center">
        <button
          onClick={onToggleSidebar}
          className="p-2 mr-3 rounded-md text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="relative hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search invoices, clients..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={16} />}
          onClick={() => setShowInvoiceModal(true)}
        >
          New Invoice
        </Button>

        <div className="relative">
          <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none">
            <Bell size={20} />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>
        </div>

        <ThemeSwitcher />

        <div className="border-l border-gray-200 h-8 mx-2"></div>

        <div className="relative">
          <button
            className="flex items-center space-x-2 group"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <Avatar
              src={userProfile?.avatar_url}
              name={userProfile?.full_name || userProfile?.email || 'User'}
              size="sm"
            />
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 hidden sm:block">
              {userProfile?.full_name?.split(' ')[0] || 'User'}
            </span>
          </button>

          {showProfileMenu && (
            <div
              ref={profileMenuRef}
              className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 py-1 border border-gray-100"
            >
              <button
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/app/profile');
                }}
              >
                <User size={16} className="mr-2" />
                My Profile
              </button>
              <button
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/app/settings');
                }}
              >
                <Settings size={16} className="mr-2" />
                Settings
              </button>
              <div className="border-t border-gray-100 my-1"></div>
              <button
                className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={async () => {
                  setShowProfileMenu(false);
                  try {
                    await supabase.auth.signOut();
                    navigate('/signin');
                  } catch (error) {
                    console.error('Error signing out:', error);
                  }
                }}
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Invoice Modal */}
        <AddInvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
        />
      </div>
    </header>
  );
};

export default Header;