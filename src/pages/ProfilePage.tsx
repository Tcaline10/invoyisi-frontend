import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import { User, Mail, Phone, MapPin, Camera, Shield, Bell, Key, Building, Globe } from 'lucide-react';
import { userService, supabase } from '../services/api';
import { useNavigate } from 'react-router-dom';
import ChangePasswordModal from '../components/Profile/ChangePasswordModal';
import DeleteAccountModal from '../components/Profile/DeleteAccountModal';

// Define the profile data type
interface ProfileData {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  location?: string;
  bio?: string;
  company_name?: string;
  avatar_url?: string;
}

// Define the company data type
interface CompanyData {
  id?: string;
  name?: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  tax_number?: string;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false); // Add edit mode state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user profile data
        const profile = await userService.getProfile();
        if (profile) {
          setProfileData(profile as ProfileData);

          // Set avatar preview if available
          if (profile.avatar_url) {
            setAvatarPreview(profile.avatar_url);
          }
        }

        // Get company data
        const company = await userService.getCompany();
        if (company) {
          setCompanyData(company);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile data. Please try again.');

        // Try to get basic user info from auth as fallback
        try {
          const { data } = await supabase.auth.getUser();
          if (data.user) {
            setProfileData({
              id: data.user.id,
              email: data.user.email || '',
              full_name: data.user.user_metadata?.full_name || '',
              avatar_url: data.user.user_metadata?.avatar_url || '',
            } as ProfileData);
          }
        } catch (authErr) {
          console.error('Failed to get user from auth:', authErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);

      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle profile data changes
  const handleProfileChange = (field: keyof ProfileData, value: string) => {
    if (profileData) {
      setProfileData({
        ...profileData,
        [field]: value
      });
    }
  };

  // Handle company data changes
  const handleCompanyChange = (field: keyof CompanyData, value: string) => {
    console.log(`Updating company ${field} to:`, value);
    console.log('Current company data before update:', companyData);

    // Create a new object with the updated field
    const updatedCompanyData = {
      ...companyData,
      [field]: value
    };

    console.log('Updated company data:', updatedCompanyData);
    console.log('Updated company data type:', typeof updatedCompanyData);
    console.log('Updated company data keys:', Object.keys(updatedCompanyData));

    // Update the state
    setCompanyData(updatedCompanyData);
  };

  // State for separate saving indicators
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);

  // Save user profile changes
  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      setError(null);
      setSuccessMessage(null);

      // Set a timeout to prevent the save button from getting stuck
      const saveTimeout = setTimeout(() => {
        if (savingProfile) {
          setSavingProfile(false);
          setError('Profile save operation timed out. Please try again.');
        }
      }, 10000);

      if (!profileData) {
        throw new Error('No profile data to save');
      }

      // Step 1: Upload avatar if changed
      let avatarUrl = profileData.avatar_url;
      if (avatarFile) {
        try {
          // Validate file size before uploading
          if (avatarFile.size > 2 * 1024 * 1024) {
            throw new Error('Avatar file size exceeds 2MB limit. Please choose a smaller image.');
          }

          // Validate file type
          const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
          if (!validTypes.includes(avatarFile.type)) {
            throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
          }

          // Upload the avatar
          avatarUrl = await userService.uploadAvatar(avatarFile);

          // Update profile data with new avatar URL
          setProfileData({
            ...profileData,
            avatar_url: avatarUrl
          });
        } catch (error: any) {
          setError(error.message || 'Failed to upload avatar. Please try again.');
          clearTimeout(saveTimeout);
          setSavingProfile(false);
          return;
        }
      }

      // Step 2: Update profile with avatar URL
      const updatedProfile = {
        ...profileData,
        avatar_url: avatarUrl
      };

      // Step 3: Save profile data
      try {
        console.log('Saving profile data:', updatedProfile);
        const result = await userService.updateProfile(updatedProfile);
        console.log('Profile data saved successfully:', result);
        setProfileData(result as ProfileData);

        // Show success message
        setSuccessMessage('Profile information updated successfully!');
      } catch (profileError: any) {
        const errorMessage = profileError.message || 'Failed to save profile. Please try again.';
        setError(errorMessage);
        clearTimeout(saveTimeout);
        setSavingProfile(false);
        return;
      }

      // Clear the save timeout
      clearTimeout(saveTimeout);
      setSavingProfile(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please try again.');
      setSavingProfile(false);
    }
  };

  // Save company information
  const handleSaveCompany = async () => {
    try {
      setSavingCompany(true);
      setError(null);
      setSuccessMessage(null);

      // Set a timeout to prevent the save button from getting stuck
      const saveTimeout = setTimeout(() => {
        if (savingCompany) {
          setSavingCompany(false);
          setError('Company save operation timed out. Please try again.');
        }
      }, 20000); // Increase timeout to 20 seconds

      if (!companyData) {
        throw new Error('No company data to save');
      }

      // Save company data
      try {
        console.log('Saving company data:', companyData);

        // Make a deep copy of the company data to avoid reference issues
        const companyDataCopy = JSON.parse(JSON.stringify(companyData));

        // Ensure we have the required fields
        if (!companyDataCopy.name) {
          companyDataCopy.name = 'Your Company Name';
        }

        if (!companyDataCopy.email) {
          companyDataCopy.email = 'your@company.com';
        }

        // Call the updateCompany function with the copy
        const companyResult = await userService.updateCompany(companyDataCopy);

        if (!companyResult) {
          throw new Error('No result returned from updateCompany');
        }

        console.log('Company data saved successfully:', companyResult);

        // Update the state with the result
        setCompanyData(companyResult);

        // Show success message
        setSuccessMessage('Company information updated successfully!');

        // Clear the save timeout
        clearTimeout(saveTimeout);
        setSavingCompany(false);
      } catch (companyError: any) {
        console.error('Error saving company data:', companyError);

        // Get a detailed error message
        let errorMessage = 'Failed to save company data. Please try again.';

        if (companyError.message) {
          errorMessage = companyError.message;
        }

        if (companyError.error) {
          errorMessage = companyError.error.message || errorMessage;
        }

        if (companyError.details) {
          errorMessage += ` (${companyError.details})`;
        }

        setError(`Error saving company data: ${errorMessage}`);
        clearTimeout(saveTimeout);
        setSavingCompany(false);
        return;
      }
    } catch (err: any) {
      console.error('Error in handleSaveCompany:', err);
      setError(`Failed to save company data: ${err.message || 'Unknown error'}`);
      setSavingCompany(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900 mb-4"></div>
        <p className="text-gray-600">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        {!editMode && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setEditMode(true)}
          >
            Edit Profile
          </Button>
        )}
      </div>

      {/* Success message - shown at the top of the page for better visibility */}
      {successMessage && (
        <div className="bg-green-100 text-green-800 px-4 py-3 rounded-md mb-4 flex items-center shadow-sm">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-100 text-red-800 px-4 py-3 rounded-md flex items-center shadow-sm">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="flex items-center space-x-4">
                <Avatar
                  src={avatarPreview || undefined}
                  size="xl"
                  name={profileData?.full_name || profileData?.email || 'User'}
                />
                <div className="flex flex-col space-y-2">
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  {editMode && (
                    <div
                      onClick={() => {
                        // Programmatically click the hidden file input
                        const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
                        if (fileInput) {
                          fileInput.click();
                        }
                      }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Camera size={16} />}
                        type="button"
                        className="cursor-pointer"
                      >
                        Change Photo
                      </Button>
                    </div>
                  )}
                  {avatarFile && (
                    <span className="text-sm text-gray-500">
                      {avatarFile.name} ({Math.round(avatarFile.size / 1024)} KB)
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  placeholder="Your full name"
                  icon={<User size={16} />}
                  value={profileData?.full_name || ''}
                  onChange={(e) => handleProfileChange('full_name', e.target.value)}
                  readOnly={!editMode}
                  disabled={!editMode}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="your@email.com"
                  icon={<Mail size={16} />}
                  value={profileData?.email || ''}
                  readOnly
                  disabled
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  placeholder="+1 (555) 123-4567"
                  icon={<Phone size={16} />}
                  value={profileData?.phone || ''}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                  readOnly={!editMode}
                  disabled={!editMode}
                />
                <Input
                  label="Location"
                  placeholder="City, Country"
                  icon={<MapPin size={16} />}
                  value={profileData?.location || ''}
                  onChange={(e) => handleProfileChange('location', e.target.value)}
                  readOnly={!editMode}
                  disabled={!editMode}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  className={`w-full h-24 px-3 py-2 border border-gray-300 rounded-md ${!editMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="Tell us about yourself"
                  value={profileData?.bio || ''}
                  onChange={(e) => handleProfileChange('bio', e.target.value)}
                  readOnly={!editMode}
                  disabled={!editMode}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                {savingProfile && (
                  <span className="text-blue-600 flex items-center bg-blue-50 px-3 py-2 rounded-md">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                    Saving your profile...
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                {editMode ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Reset form and exit edit mode
                        setEditMode(false);

                        // Reload the data to discard changes
                        const fetchProfileData = async () => {
                          try {
                            // Get user profile data
                            const profile = await userService.getProfile();
                            if (profile) {
                              setProfileData(profile as ProfileData);
                              if (profile.avatar_url) {
                                setAvatarPreview(profile.avatar_url);
                              }
                            }

                            // Get company data
                            const company = await userService.getCompany();
                            if (company) {
                              setCompanyData(company);
                            }
                          } catch (err) {
                            console.error('Error reloading profile:', err);
                          }
                        };

                        fetchProfileData();
                      }}
                      disabled={savingProfile || savingCompany}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSaveProfile}
                      disabled={savingProfile || savingCompany}
                    >
                      Save Profile
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                  >
                    Back to Dashboard
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Company Name"
                  placeholder="Your company name"
                  icon={<Building size={16} />}
                  value={companyData?.name || ''}
                  onChange={(e) => handleCompanyChange('name', e.target.value)}
                  readOnly={!editMode}
                  disabled={!editMode}
                />
                <Input
                  label="Company Email"
                  type="email"
                  placeholder="company@example.com"
                  icon={<Mail size={16} />}
                  value={companyData?.email || ''}
                  onChange={(e) => handleCompanyChange('email', e.target.value)}
                  readOnly={!editMode}
                  disabled={!editMode}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Company Phone"
                  placeholder="+1 (555) 123-4567"
                  icon={<Phone size={16} />}
                  value={companyData?.phone || ''}
                  onChange={(e) => handleCompanyChange('phone', e.target.value)}
                  readOnly={!editMode}
                  disabled={!editMode}
                />
                <Input
                  label="Tax Number"
                  placeholder="Tax ID / VAT Number"
                  icon={<Shield size={16} />}
                  value={companyData?.tax_number || ''}
                  onChange={(e) => handleCompanyChange('tax_number', e.target.value)}
                  readOnly={!editMode}
                  disabled={!editMode}
                />
              </div>
              <div>
                <Input
                  label="Company Address"
                  placeholder="Full company address"
                  icon={<MapPin size={16} />}
                  value={companyData?.address || ''}
                  onChange={(e) => handleCompanyChange('address', e.target.value)}
                  readOnly={!editMode}
                  disabled={!editMode}
                />
              </div>
              <div>
                <Input
                  label="Website"
                  placeholder="https://yourcompany.com"
                  icon={<Globe size={16} />}
                  value={companyData?.website || ''}
                  onChange={(e) => handleCompanyChange('website', e.target.value)}
                  readOnly={!editMode}
                  disabled={!editMode}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                {savingCompany && (
                  <span className="text-blue-600 flex items-center bg-blue-50 px-3 py-2 rounded-md">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                    Saving company information...
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                {editMode && (
                  <Button
                    variant="primary"
                    onClick={handleSaveCompany}
                    disabled={savingProfile || savingCompany}
                  >
                    Save Company
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                icon={<Key size={16} />}
                onClick={() => setShowChangePasswordModal(true)}
              >
                Change Password
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                icon={<Shield size={16} />}
              >
                Two-Factor Authentication
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:bg-red-50"
                icon={<Shield size={16} className="text-red-600" />}
                onClick={() => setShowDeleteAccountModal(true)}
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-[#1DA1F2] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </div>
                  <span className="ml-2 font-medium">Twitter</span>
                </div>
                <Button variant="outline" size="sm">Disconnect</Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-[#4267B2] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <span className="ml-2 font-medium">Facebook</span>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />

      <DeleteAccountModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
      />
    </div>
  );
};

export default ProfilePage;