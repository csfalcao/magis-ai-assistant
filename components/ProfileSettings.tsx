'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Link from 'next/link';
import { ArrowLeft, User, Save, Plus, Trash2 } from 'lucide-react';

export default function ProfileSettings() {
  const [activeTab, setActiveTab] = useState('personal');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Convex queries and mutations
  const userProfile = useQuery(api.profile.getUserProfile);
  const updatePersonalInfo = useMutation(api.profile.updatePersonalInfo);
  const updateWorkInfo = useMutation(api.profile.updateWorkInfo);
  const updateFamilyInfo = useMutation(api.profile.updateFamilyInfo);

  // Form states
  const [personalData, setPersonalData] = useState<any>({});
  const [workData, setWorkData] = useState<any>({});
  const [familyData, setFamilyData] = useState<any>({});
  const [profileError, setProfileError] = useState<string | null>(null);

  // Initialize form data when profile loads
  useEffect(() => {
    if (userProfile) {
      setPersonalData(userProfile.personalInfo || {});
      setWorkData(userProfile.workInfo || {});
      setFamilyData(userProfile.familyInfo || {});
      setProfileError(null);
    }
  }, [userProfile]);

  // Handle profile loading states
  if (userProfile === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magis-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const handleSavePersonal = async () => {
    setIsSaving(true);
    try {
      await updatePersonalInfo(personalData);
      setSaveMessage('Personal information saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Error saving personal information');
      console.error('Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWork = async () => {
    setIsSaving(true);
    try {
      await updateWorkInfo(workData);
      setSaveMessage('Work information saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Error saving work information');
      console.error('Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFamily = async () => {
    setIsSaving(true);
    try {
      await updateFamilyInfo(familyData);
      setSaveMessage('Family information saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Error saving family information');
      console.error('Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'work', label: 'Work', icon: User },
    { id: 'family', label: 'Family', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/chat" 
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Chat
              </Link>
              <div className="w-px h-6 bg-gray-300" />
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-magis-50 text-magis-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Profile Settings</h1>
                  <p className="text-sm text-gray-500">
                    Manage your personal information
                  </p>
                </div>
              </div>
            </div>
            
            {saveMessage && (
              <div className={`text-sm px-3 py-1 rounded-md ${
                saveMessage.includes('Error') 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {saveMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-magis-500 text-magis-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Personal Tab */}
        {activeTab === 'personal' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Personal Information</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={personalData.firstName || ''}
                    onChange={(e) => setPersonalData({...personalData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magis-500 focus:border-magis-500"
                    placeholder="Enter your first name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={personalData.lastName || ''}
                    onChange={(e) => setPersonalData({...personalData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magis-500 focus:border-magis-500"
                    placeholder="Enter your last name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    value={personalData.age || ''}
                    onChange={(e) => setPersonalData({...personalData, age: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magis-500 focus:border-magis-500"
                    placeholder="Enter your age"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={personalData.location || ''}
                    onChange={(e) => setPersonalData({...personalData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magis-500 focus:border-magis-500"
                    placeholder="Enter your location"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={personalData.bio || ''}
                  onChange={(e) => setPersonalData({...personalData, bio: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magis-500 focus:border-magis-500"
                  placeholder="Tell us about yourself..."
                />
              </div>
              
              <button
                onClick={handleSavePersonal}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-magis-600 text-white rounded-lg hover:bg-magis-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Personal Info'}
              </button>
            </div>
          </div>
        )}

        {/* Work Tab */}
        {activeTab === 'work' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Work Information</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={workData.jobTitle || ''}
                    onChange={(e) => setWorkData({...workData, jobTitle: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magis-500 focus:border-magis-500"
                    placeholder="Enter your job title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={workData.company || ''}
                    onChange={(e) => setWorkData({...workData, company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magis-500 focus:border-magis-500"
                    placeholder="Enter your company"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={workData.industry || ''}
                    onChange={(e) => setWorkData({...workData, industry: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magis-500 focus:border-magis-500"
                    placeholder="Enter your industry"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Location
                  </label>
                  <input
                    type="text"
                    value={workData.workLocation || ''}
                    onChange={(e) => setWorkData({...workData, workLocation: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magis-500 focus:border-magis-500"
                    placeholder="Enter your work location"
                  />
                </div>
              </div>
              
              <button
                onClick={handleSaveWork}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-magis-600 text-white rounded-lg hover:bg-magis-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Work Info'}
              </button>
            </div>
          </div>
        )}

        {/* Family Tab */}
        {activeTab === 'family' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Family Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship Status
                </label>
                <select
                  value={familyData.relationshipStatus || ''}
                  onChange={(e) => setFamilyData({...familyData, relationshipStatus: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magis-500 focus:border-magis-500"
                >
                  <option value="">Select status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="partnership">In a partnership</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>
              
              {familyData.relationshipStatus && ['married', 'partnership'].includes(familyData.relationshipStatus) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Partner's Name
                  </label>
                  <input
                    type="text"
                    value={familyData.partnerName || ''}
                    onChange={(e) => setFamilyData({...familyData, partnerName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magis-500 focus:border-magis-500"
                    placeholder="Enter your partner's name"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Children
                </label>
                <input
                  type="number"
                  min="0"
                  value={familyData.numberOfChildren || 0}
                  onChange={(e) => setFamilyData({...familyData, numberOfChildren: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magis-500 focus:border-magis-500"
                />
              </div>
              
              <button
                onClick={handleSaveFamily}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-magis-600 text-white rounded-lg hover:bg-magis-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Family Info'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}