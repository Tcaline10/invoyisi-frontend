import React, { createContext, useContext, useState, useEffect } from 'react';
import OnboardingModal from '../components/Onboarding/OnboardingModal';

interface OnboardingContextType {
  showOnboarding: () => void;
  hideOnboarding: () => void;
  isOnboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType>({
  showOnboarding: () => {},
  hideOnboarding: () => {},
  isOnboardingComplete: false,
  setOnboardingComplete: () => {},
});

export const useOnboarding = () => useContext(OnboardingContext);

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  // Check if onboarding has been completed before
  useEffect(() => {
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (onboardingComplete === 'true') {
      setIsOnboardingComplete(true);
    } else {
      // If this is the first time, show onboarding after a short delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const showOnboarding = () => {
    setIsOpen(true);
  };

  const hideOnboarding = () => {
    setIsOpen(false);
  };

  const handleOnboardingComplete = (complete: boolean) => {
    setIsOnboardingComplete(complete);
    localStorage.setItem('onboardingComplete', complete.toString());
  };

  return (
    <OnboardingContext.Provider
      value={{
        showOnboarding,
        hideOnboarding,
        isOnboardingComplete,
        setOnboardingComplete: handleOnboardingComplete,
      }}
    >
      {children}
      <OnboardingModal
        isOpen={isOpen}
        onClose={() => {
          hideOnboarding();
          handleOnboardingComplete(true);
        }}
      />
    </OnboardingContext.Provider>
  );
};

export default OnboardingProvider;
