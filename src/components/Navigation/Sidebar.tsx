import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, BarChart4, Settings, LogOut,
  CreditCard, Clock, Inbox, ChevronDown, ChevronRight, Info,
  FileSearch, Search, Brain, Download, Globe, TestTube
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import { supabase } from '../../services/api';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  hasSubmenu?: boolean;
  expanded?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  to,
  icon,
  label,
  active = false,
  hasSubmenu = false,
  expanded = false,
  onClick,
  children
}) => {
  return (
    <div className="mb-1">
      <Link
        to={to}
        className={`flex items-center px-3 py-2 text-sm rounded-md group w-full transition-colors ${
          active
            ? 'bg-blue-900/10 text-blue-900 font-medium'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        onClick={onClick}
      >
        <span className="mr-3 text-lg">{icon}</span>
        <span className="flex-1">{label}</span>
        {hasSubmenu && (
          <span className="ml-auto">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
      </Link>
      {hasSubmenu && expanded && (
        <div className="pl-10 mt-1">
          {children}
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = React.useState({
    invoices: true,
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

  const toggleExpanded = (key: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-100 flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100">
        <Link to="/about" className="flex items-center hover:opacity-80 transition-opacity">
          <div className="flex items-center justify-center w-12 h-12">
            <img src="/logo.svg" alt="Logo" className="w-10 h-10" />
          </div>
          <h1 className="ml-2 text-xl font-bold text-gray-900">I-Invoyisi</h1>
        </Link>
      </div>

      <div className="px-4 py-2 border-b border-gray-100">
        <button
          className="flex items-center py-2 w-full text-left hover:bg-gray-50 rounded-md transition-colors"
          onClick={() => navigate('/app/profile')}
        >
          <Avatar
            src={userProfile?.avatar_url}
            name={userProfile?.full_name || userProfile?.email || 'User'}
            size="sm"
          />
          <div className="ml-2">
            <div className="text-sm font-medium text-gray-900">{userProfile?.full_name || 'User'}</div>
            <div className="text-xs text-gray-500">{userProfile?.email || ''}</div>
          </div>
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          <SidebarItem
            to="/app/dashboard"
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            active={location.pathname === '/' || location.pathname === '/app/dashboard'}
          />

          <SidebarItem
            to="/app/invoices"
            icon={<FileText size={18} />}
            label="Invoices"
            active={location.pathname.startsWith('/app/invoices')}
            hasSubmenu
            expanded={expanded.invoices}
            onClick={() => toggleExpanded('invoices')}
          >
            <Link to="/app/invoices" className={`block py-1 px-2 text-sm rounded ${location.pathname === '/app/invoices' ? 'text-blue-900 font-medium' : 'text-gray-600 hover:text-gray-900'}`}>
              All Invoices
            </Link>
            <Link to="/app/invoices/filter/draft" className={`block py-1 px-2 text-sm rounded ${location.pathname === '/app/invoices/filter/draft' ? 'text-blue-900 font-medium' : 'text-gray-600 hover:text-gray-900'}`}>
              Drafts
            </Link>
            <Link to="/app/invoices/filter/unpaid" className={`block py-1 px-2 text-sm rounded ${location.pathname === '/app/invoices/filter/unpaid' ? 'text-blue-900 font-medium' : 'text-gray-600 hover:text-gray-900'}`}>
              Unpaid
            </Link>
            <Link to="/app/invoices/filter/paid" className={`block py-1 px-2 text-sm rounded ${location.pathname === '/app/invoices/filter/paid' ? 'text-blue-900 font-medium' : 'text-gray-600 hover:text-gray-900'}`}>
              Paid
            </Link>
          </SidebarItem>

          <SidebarItem
            to="/app/clients"
            icon={<Users size={18} />}
            label="Clients"
            active={location.pathname.startsWith('/app/clients')}
          />

          <SidebarItem
            to="/app/payments"
            icon={<CreditCard size={18} />}
            label="Payments"
            active={location.pathname.startsWith('/app/payments')}
          />

          <SidebarItem
            to="/app/reports"
            icon={<BarChart4 size={18} />}
            label="Reports"
            active={location.pathname.startsWith('/app/reports')}
          />

          <SidebarItem
            to="/app/recurring-invoices"
            icon={<Clock size={18} />}
            label="Recurring Invoices"
            active={location.pathname.startsWith('/app/recurring-invoices')}
          />

          <SidebarItem
            to="/app/documents"
            icon={<Search size={18} />}
            label="Document Processing"
            active={location.pathname.startsWith('/app/documents')}
          />
        </div>

        <div className="mt-8">
          <div className="px-3 mb-2 text-xs font-medium text-black uppercase tracking-wider">
            AI Tools
          </div>
          <SidebarItem
            to="/app/ai-categorization"
            icon={<Brain size={18} />}
            label="AI Categorization"
            active={location.pathname.startsWith('/app/ai-categorization')}
          />
          <SidebarItem
            to="/app/export"
            icon={<Download size={18} />}
            label="Export & Reports"
            active={location.pathname.startsWith('/app/export')}
          />
          <SidebarItem
            to="/app/currency"
            icon={<Globe size={18} />}
            label="Multi-Currency"
            active={location.pathname.startsWith('/app/currency')}
          />
          <SidebarItem
            to="/testing"
            icon={<TestTube size={18} />}
            label="Feature Testing"
            active={location.pathname.startsWith('/testing')}
          />
        </div>

        <div className="mt-8">
          <div className="px-3 mb-2 text-xs font-medium text-black uppercase tracking-wider">
            Settings
          </div>
          <SidebarItem
            to="/app/settings"
            icon={<Settings size={18} />}
            label="Settings"
            active={location.pathname.startsWith('/app/settings')}
          />
          <SidebarItem
            to="/about"
            icon={<Info size={18} />}
            label="About"
            active={location.pathname.startsWith('/about')}
          />
        </div>
      </nav>

      <div className="px-3 py-3 border-t border-gray-100">
        <button
          className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          onClick={async () => {
            try {
              await supabase.auth.signOut();
              navigate('/signin');
            } catch (error) {
              console.error('Error signing out:', error);
            }
          }}
        >
          <LogOut size={18} className="mr-3" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;