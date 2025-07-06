'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

interface ProfileData {
  personalInfo?: any;
  workInfo?: any;
  familyInfo?: any;
  personalPreferences?: any;
  serviceProviders?: any;
  profileCompletion?: any;
}

export default function ProfileSettings() {
  const [activeTab, setActiveTab] = useState('personal');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Convex queries and mutations
  const userProfile = useQuery(api.profile.getUserProfile);
  const updatePersonalInfo = useMutation(api.profile.updatePersonalInfo);
  const updateWorkInfo = useMutation(api.profile.updateWorkInfo);
  const updateFamilyInfo = useMutation(api.profile.updateFamilyInfo);
  const updateServiceProviders = useMutation(api.profile.updateServiceProviders);
  const addFamilyMember = useMutation(api.profile.addFamilyMember);

  // Form states
  const [personalData, setPersonalData] = useState<any>({});
  const [workData, setWorkData] = useState<any>({});
  const [familyData, setFamilyData] = useState<any>({});
  const [serviceData, setServiceData] = useState<any>({});
  const [preferencesData, setPreferencesData] = useState<any>({});

  // Initialize form data when profile loads
  useEffect(() => {
    if (userProfile) {
      setPersonalData(userProfile.personalInfo || {});
      setWorkData(userProfile.workInfo || {});
      setFamilyData(userProfile.familyInfo || {});
      setServiceData(userProfile.serviceProviders || {});
      setPreferencesData(userProfile.personalPreferences || {});
    }
  }, [userProfile]);

  const showSaveMessage = (message: string) => {
    setSaveMessage(message);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Save handlers for each section
  const handleSavePersonal = async () => {
    setIsSaving(true);
    try {
      await updatePersonalInfo({ personalInfo: personalData });
      showSaveMessage('Personal information saved successfully!');
    } catch (error) {
      showSaveMessage('Error saving personal information');
    }
    setIsSaving(false);
  };

  const handleSaveWork = async () => {
    setIsSaving(true);
    try {
      await updateWorkInfo({ workInfo: workData });
      showSaveMessage('Work information saved successfully!');
    } catch (error) {
      showSaveMessage('Error saving work information');
    }
    setIsSaving(false);
  };

  const handleSaveFamily = async () => {
    setIsSaving(true);
    try {
      await updateFamilyInfo({ familyInfo: familyData });
      showSaveMessage('Family information saved successfully!');
    } catch (error) {
      showSaveMessage('Error saving family information');
    }
    setIsSaving(false);
  };

  const handleSaveServices = async () => {
    setIsSaving(true);
    try {
      await updateServiceProviders({ serviceProviders: serviceData });
      showSaveMessage('Service providers saved successfully!');
    } catch (error) {
      showSaveMessage('Error saving service providers');
    }
    setIsSaving(false);
  };

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
        <p className="text-gray-600 mb-4">
          Help MAGIS learn about you for more personalized assistance
        </p>
        
        {/* Overall completion */}
        {userProfile.profileCompletion && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                <span className="text-sm text-gray-500">
                  {userProfile.profileCompletion.overall || 0}%
                </span>
              </div>
              <Progress value={userProfile.profileCompletion.overall || 0} className="h-2" />
              <div className="grid grid-cols-5 gap-4 mt-4 text-xs text-gray-500">
                <div className="text-center">
                  <div className="font-medium">Personal</div>
                  <div>{userProfile.profileCompletion.personalInfo || 0}%</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Work</div>
                  <div>{userProfile.profileCompletion.workInfo || 0}%</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Family</div>
                  <div>{userProfile.profileCompletion.familyInfo || 0}%</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Preferences</div>
                  <div>{userProfile.profileCompletion.preferences || 0}%</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Services</div>
                  <div>{userProfile.profileCompletion.serviceProviders || 0}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save message */}
        {saveMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800">
            {saveMessage}
          </div>
        )}
      </div>

      {/* Profile Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="work">Work</TabsTrigger>
          <TabsTrigger value="family">Family</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal" className="space-y-6">
          <PersonalInfoForm
            data={personalData}
            onChange={setPersonalData}
            onSave={handleSavePersonal}
            isSaving={isSaving}
          />
        </TabsContent>

        {/* Work Information Tab */}
        <TabsContent value="work" className="space-y-6">
          <WorkInfoForm
            data={workData}
            onChange={setWorkData}
            onSave={handleSaveWork}
            isSaving={isSaving}
          />
        </TabsContent>

        {/* Family Information Tab */}
        <TabsContent value="family" className="space-y-6">
          <FamilyInfoForm
            data={familyData}
            onChange={setFamilyData}
            onSave={handleSaveFamily}
            isSaving={isSaving}
          />
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <PreferencesForm
            data={preferencesData}
            onChange={setPreferencesData}
            onSave={handleSavePersonal} // Uses personal info update
            isSaving={isSaving}
          />
        </TabsContent>

        {/* Service Providers Tab */}
        <TabsContent value="services" className="space-y-6">
          <ServiceProvidersForm
            data={serviceData}
            onChange={setServiceData}
            onSave={handleSaveServices}
            isSaving={isSaving}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Personal Information Form Component
function PersonalInfoForm({ data, onChange, onSave, isSaving }: any) {
  const updateField = (path: string, value: any) => {
    const keys = path.split('.');
    const newData = { ...data };
    let current = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    onChange(newData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Basic information about you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={data.firstName || ''}
              onChange={(e) => updateField('firstName', e.target.value)}
              placeholder="Your first name"
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={data.lastName || ''}
              onChange={(e) => updateField('lastName', e.target.value)}
              placeholder="Your last name"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="nickname">Nickname (Optional)</Label>
          <Input
            id="nickname"
            value={data.nickname || ''}
            onChange={(e) => updateField('nickname', e.target.value)}
            placeholder="What should MAGIS call you?"
          />
        </div>

        {/* Location */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Location</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={data.location?.city || ''}
                onChange={(e) => updateField('location.city', e.target.value)}
                placeholder="Your city"
              />
            </div>
            <div>
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={data.location?.state || ''}
                onChange={(e) => updateField('location.state', e.target.value)}
                placeholder="Your state or province"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={data.location?.country || ''}
                onChange={(e) => updateField('location.country', e.target.value)}
                placeholder="Your country"
              />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={data.location?.timezone || ''}
                onValueChange={(value: string) => updateField('location.timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="America/Sao_Paulo">São Paulo Time</SelectItem>
                  <SelectItem value="Europe/London">London Time</SelectItem>
                  <SelectItem value="Europe/Paris">Paris Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Contact Information</h4>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={data.contactInfo?.phone || ''}
              onChange={(e) => updateField('contactInfo.phone', e.target.value)}
              placeholder="Your phone number"
              type="tel"
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={data.contactInfo?.address || ''}
              onChange={(e) => updateField('contactInfo.address', e.target.value)}
              placeholder="Your address"
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Personal Info'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Work Information Form Component
function WorkInfoForm({ data, onChange, onSave, isSaving }: any) {
  const updateField = (path: string, value: any) => {
    const keys = path.split('.');
    const newData = { ...data };
    let current = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    onChange(newData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Information</CardTitle>
        <CardDescription>Your professional details and schedule</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Employment */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Employment</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employmentStatus">Employment Status</Label>
              <Select
                value={data.employment?.status || ''}
                onValueChange={(value: string) => updateField('employment.status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employed">Employed</SelectItem>
                  <SelectItem value="self_employed">Self Employed</SelectItem>
                  <SelectItem value="entrepreneur">Entrepreneur</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                  <SelectItem value="unemployed">Unemployed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="employmentType">Employment Type</Label>
              <Select
                value={data.employment?.type || ''}
                onValueChange={(value: string) => updateField('employment.type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={data.employment?.company || ''}
              onChange={(e) => updateField('employment.company', e.target.value)}
              placeholder="Your company name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={data.employment?.position || ''}
                onChange={(e) => updateField('employment.position', e.target.value)}
                placeholder="Your job title"
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={data.employment?.department || ''}
                onChange={(e) => updateField('employment.department', e.target.value)}
                placeholder="Your department"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={data.employment?.industry || ''}
              onChange={(e) => updateField('employment.industry', e.target.value)}
              placeholder="Your industry"
            />
          </div>
        </div>

        {/* Work Schedule */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Work Schedule</h4>
          <div>
            <Label htmlFor="remoteWork">Remote Work</Label>
            <Select
              value={data.workSchedule?.remoteWork || ''}
              onValueChange={(value: string) => updateField('workSchedule.remoteWork', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="always">Always Remote</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="never">Office Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Work Info'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Family Information Form Component (simplified version)
function FamilyInfoForm({ data, onChange, onSave, isSaving }: any) {
  const updateField = (path: string, value: any) => {
    const keys = path.split('.');
    const newData = { ...data };
    let current = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    onChange(newData);
  };

  const addChild = () => {
    const children = data.children || [];
    children.push({ name: '', nickname: '', dateOfBirth: null, grade: '', school: '' });
    updateField('children', children);
  };

  const removeChild = (index: number) => {
    const children = [...(data.children || [])];
    children.splice(index, 1);
    updateField('children', children);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Family Information</CardTitle>
        <CardDescription>Information about your family members</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Relationship Status */}
        <div>
          <Label htmlFor="relationshipStatus">Relationship Status</Label>
          <Select
            value={data.relationshipStatus || ''}
            onValueChange={(value: string) => updateField('relationshipStatus', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="dating">Dating</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Children */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Children</h4>
            <Button variant="outline" size="sm" onClick={addChild}>
              <Plus className="h-4 w-4 mr-2" />
              Add Child
            </Button>
          </div>
          
          {data.children?.map((child: any, index: number) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h5 className="text-sm font-medium">Child {index + 1}</h5>
                <Button variant="ghost" size="sm" onClick={() => removeChild(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={child.name || ''}
                    onChange={(e) => {
                      const children = [...(data.children || [])];
                      children[index] = { ...children[index], name: e.target.value };
                      updateField('children', children);
                    }}
                    placeholder="Child's name"
                  />
                </div>
                <div>
                  <Label>Nickname</Label>
                  <Input
                    value={child.nickname || ''}
                    onChange={(e) => {
                      const children = [...(data.children || [])];
                      children[index] = { ...children[index], nickname: e.target.value };
                      updateField('children', children);
                    }}
                    placeholder="Nickname (optional)"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Grade</Label>
                  <Input
                    value={child.grade || ''}
                    onChange={(e) => {
                      const children = [...(data.children || [])];
                      children[index] = { ...children[index], grade: e.target.value };
                      updateField('children', children);
                    }}
                    placeholder="School grade"
                  />
                </div>
                <div>
                  <Label>School</Label>
                  <Input
                    value={child.school || ''}
                    onChange={(e) => {
                      const children = [...(data.children || [])];
                      children[index] = { ...children[index], school: e.target.value };
                      updateField('children', children);
                    }}
                    placeholder="School name"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Family Info'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Preferences Form Component (simplified)
function PreferencesForm({ data, onChange, onSave, isSaving }: any) {
  const updateField = (path: string, value: any) => {
    const keys = path.split('.');
    const newData = { ...data };
    let current = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    onChange(newData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Preferences</CardTitle>
        <CardDescription>Your lifestyle and communication preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lifestyle */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Lifestyle</h4>
          <div>
            <Label htmlFor="diet">Diet</Label>
            <Select
              value={data.lifestyle?.diet || ''}
              onValueChange={(value: string) => updateField('lifestyle.diet', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select diet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="omnivore">Omnivore</SelectItem>
                <SelectItem value="vegetarian">Vegetarian</SelectItem>
                <SelectItem value="vegan">Vegan</SelectItem>
                <SelectItem value="keto">Keto</SelectItem>
                <SelectItem value="mediterranean">Mediterranean</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Communication */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Communication Style</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="preferredStyle">Preferred Style</Label>
              <Select
                value={data.communication?.preferredStyle || ''}
                onValueChange={(value: string) => updateField('communication.preferredStyle', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="responseLength">Response Length</Label>
              <Select
                value={data.communication?.responseLength || ''}
                onValueChange={(value: string) => updateField('communication.responseLength', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brief">Brief</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Service Providers Form Component (simplified)
function ServiceProvidersForm({ data, onChange, onSave, isSaving }: any) {
  const addProvider = (type: 'healthcare' | 'automotive' | 'home' | 'financial') => {
    const providers = { ...data };
    if (!providers[type]) providers[type] = [];
    
    const newProvider = { type: '', name: '', phone: '', address: '' };
    providers[type].push(newProvider);
    onChange(providers);
  };

  const removeProvider = (type: 'healthcare' | 'automotive' | 'home' | 'financial', index: number) => {
    const providers = { ...data };
    if (providers[type]) {
      providers[type].splice(index, 1);
      onChange(providers);
    }
  };

  const updateProvider = (type: 'healthcare' | 'automotive' | 'home' | 'financial', index: number, field: string, value: string) => {
    const providers = { ...data };
    if (!providers[type]) providers[type] = [];
    if (!providers[type][index]) providers[type][index] = {};
    providers[type][index][field] = value;
    onChange(providers);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Providers</CardTitle>
        <CardDescription>Healthcare, automotive, home, and financial service providers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Healthcare Providers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Healthcare Providers</h4>
            <Button variant="outline" size="sm" onClick={() => addProvider('healthcare')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
          </div>
          
          {data.healthcare?.map((provider: any, index: number) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h5 className="text-sm font-medium">Healthcare Provider {index + 1}</h5>
                <Button variant="ghost" size="sm" onClick={() => removeProvider('healthcare', index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={provider.type || ''}
                    onValueChange={(value: string) => updateProvider('healthcare', index, 'type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary_care">Primary Care</SelectItem>
                      <SelectItem value="dentist">Dentist</SelectItem>
                      <SelectItem value="ophthalmologist">Ophthalmologist</SelectItem>
                      <SelectItem value="dermatologist">Dermatologist</SelectItem>
                      <SelectItem value="specialist">Specialist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Name</Label>
                  <Input
                    value={provider.name || ''}
                    onChange={(e) => updateProvider('healthcare', index, 'name', e.target.value)}
                    placeholder="Provider name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={provider.phone || ''}
                    onChange={(e) => updateProvider('healthcare', index, 'phone', e.target.value)}
                    placeholder="Phone number"
                    type="tel"
                  />
                </div>
                <div>
                  <Label>Practice/Clinic</Label>
                  <Input
                    value={provider.practice || ''}
                    onChange={(e) => updateProvider('healthcare', index, 'practice', e.target.value)}
                    placeholder="Practice or clinic name"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Service Providers'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}