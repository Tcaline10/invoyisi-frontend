import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import UserGuideModal from './UserGuideModal';

interface UserGuideButtonProps {
  className?: string;
}

const UserGuideButton: React.FC<UserGuideButtonProps> = ({ className = '' }) => {
  const [showGuide, setShowGuide] = useState(false);
  
  return (
    <>
      <button
        onClick={() => setShowGuide(true)}
        className={`flex items-center justify-center p-2 rounded-full bg-blue-900 text-white hover:bg-blue-800 transition-colors ${className}`}
        title="User Guide"
      >
        <HelpCircle size={20} />
      </button>
      
      <UserGuideModal 
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />
    </>
  );
};

export default UserGuideButton;
