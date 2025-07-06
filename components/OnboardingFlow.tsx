'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({
    personal: {},
    work: {},
    family: {},
    preferences: {},
  });

  // Convex mutations
  const updatePersonalInfo = useMutation(api.profile.updatePersonalInfo);
  const updateWorkInfo = useMutation(api.profile.updateWorkInfo);
  const updateFamilyInfo = useMutation(api.profile.updateFamilyInfo);
  const completeOnboarding = useMutation(api.profile.completeOnboarding);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to MAGIS',
      description: 'Let\'s get to know you better',
      component: WelcomeStep,
    },
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Basic information about you',
      component: PersonalStep,
    },
    {
      id: 'work',
      title: 'Work Context',
      description: 'Your professional details',
      component: WorkStep,
    },
    {
      id: 'family',
      title: 'Family & Household',
      description: 'People who matter to you',
      component: FamilyStep,
    },
    {
      id: 'preferences',
      title: 'Communication Style',
      description: 'How you prefer to interact',
      component: PreferencesStep,
    },
    {
      id: 'complete',
      title: 'All Set!',
      description: 'Your profile is ready',
      component: CompleteStep,
    },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async () => {
    // Save current step data
    await saveCurrentStepData();
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveCurrentStepData = async () => {
    try {
      switch (steps[currentStep].id) {
        case 'personal':
          if (Object.keys(formData.personal).length > 0) {
            await updatePersonalInfo({ personalInfo: formData.personal });
          }
          break;
        case 'work':
          if (Object.keys(formData.work).length > 0) {
            await updateWorkInfo({ workInfo: formData.work });
          }
          break;
        case 'family':
          if (Object.keys(formData.family).length > 0) {
            await updateFamilyInfo({ familyInfo: formData.family });
          }
          break;
      }
    } catch (error) {
      console.error('Error saving step data:', error);
    }
  };

  const handleComplete = async () => {
    await completeOnboarding();
    // Redirect to main app or close onboarding
    window.location.href = '/';
  };

  const updateFormData = (section: string, data: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }));
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="text-2xl font-bold text-blue-600">MAGIS</div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {steps[currentStep].title}
          </h1>
          <p className="text-gray-600 mb-6">
            {steps[currentStep].description}
          </p>
          <Progress value={progress} className="h-2 bg-white" />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </div>

        {/* Step Content */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <CurrentStepComponent
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onComplete={handleComplete}
              isFirstStep={currentStep === 0}
              isLastStep={currentStep === steps.length - 1}
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        {currentStep > 0 && currentStep < steps.length - 1 && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              className="flex items-center"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Welcome Step Component
function WelcomeStep({ onNext }: any) {
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
        <div className="text-2xl">🧠</div>
      </div>
      <div>
        <h2 className="text-2xl font-semibold mb-4">Welcome to MAGIS</h2>
        <p className="text-gray-600 mb-6">
          MAGIS is your personal AI assistant that learns about you to provide better, 
          more personalized help. This quick setup will help MAGIS understand your 
          context and preferences.
        </p>
        <div className="text-sm text-gray-500 mb-8">
          <p>✓ All information is private and secure</p>
          <p>✓ You can update or delete anything later</p>
          <p>✓ Skip any questions you're not comfortable answering</p>
        </div>
      </div>
      <Button onClick={onNext} size="lg" className="w-full">
        Get Started
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

// Personal Information Step
function PersonalStep({ formData, updateFormData }: any) {
  const personal = formData.personal || {};

  const updateField = (field: string, value: string) => {
    updateFormData('personal', { [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Tell us about yourself</h2>
        <p className="text-gray-600">This helps MAGIS address you properly and understand your context</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={personal.firstName || ''}
            onChange={(e) => updateField('firstName', e.target.value)}
            placeholder="Your first name"
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={personal.lastName || ''}
            onChange={(e) => updateField('lastName', e.target.value)}
            placeholder="Your last name"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="nickname">What should MAGIS call you? (Optional)</Label>
        <Input
          id="nickname"
          value={personal.nickname || ''}
          onChange={(e) => updateField('nickname', e.target.value)}
          placeholder="e.g., John, Dr. Smith, or whatever you prefer"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={personal.city || ''}
            onChange={(e) => updateField('city', e.target.value)}
            placeholder="Your city"
          />
        </div>
        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <Select
            value={personal.timezone || ''}
            onValueChange={(value: string) => updateField('timezone', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="America/New_York">Eastern Time (US)</SelectItem>
              <SelectItem value="America/Chicago">Central Time (US)</SelectItem>
              <SelectItem value="America/Denver">Mountain Time (US)</SelectItem>
              <SelectItem value="America/Los_Angeles">Pacific Time (US)</SelectItem>
              <SelectItem value="America/Sao_Paulo">São Paulo (Brazil)</SelectItem>
              <SelectItem value="Europe/London">London (UK)</SelectItem>
              <SelectItem value="Europe/Paris">Paris (EU)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// Work Information Step
function WorkStep({ formData, updateFormData }: any) {
  const work = formData.work || {};

  const updateField = (field: string, value: string) => {
    updateFormData('work', { employment: { ...work.employment, [field]: value } });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Your work context</h2>
        <p className="text-gray-600">This helps MAGIS understand your professional life and schedule</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="employmentStatus">Employment Status</Label>
          <Select
            value={work.employment?.status || ''}
            onValueChange={(value: string) => updateField('status', value)}
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
              <SelectItem value="unemployed">Looking for work</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="employmentType">Work Type</Label>
          <Select
            value={work.employment?.type || ''}
            onValueChange={(value: string) => updateField('type', value)}
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
        <Label htmlFor="company">Company/Organization (Optional)</Label>
        <Input
          id="company"
          value={work.employment?.company || ''}
          onChange={(e) => updateField('company', e.target.value)}
          placeholder="Where do you work?"
        />
      </div>

      <div>
        <Label htmlFor="position">Position/Role (Optional)</Label>
        <Input
          id="position"
          value={work.employment?.position || ''}
          onChange={(e) => updateField('position', e.target.value)}
          placeholder="Your job title or role"
        />
      </div>
    </div>
  );
}

// Family Step Component
function FamilyStep({ formData, updateFormData }: any) {
  const family = formData.family || {};

  const updateField = (field: string, value: string) => {
    updateFormData('family', { [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Family & household</h2>
        <p className="text-gray-600">This helps MAGIS understand your personal context and relationships</p>
      </div>

      <div>
        <Label htmlFor="relationshipStatus">Relationship Status (Optional)</Label>
        <Select
          value={family.relationshipStatus || ''}
          onValueChange={(value: string) => updateField('relationshipStatus', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select if you'd like to share" />
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

      <div>
        <Label htmlFor="householdSize">How many people live in your household? (Optional)</Label>
        <Select
          value={family.householdSize || ''}
          onValueChange={(value: string) => updateField('householdSize', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select household size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Just me</SelectItem>
            <SelectItem value="2">2 people</SelectItem>
            <SelectItem value="3">3 people</SelectItem>
            <SelectItem value="4">4 people</SelectItem>
            <SelectItem value="5+">5 or more people</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-gray-500 bg-blue-50 p-4 rounded-md">
        <p className="mb-2"><strong>Note:</strong> You can add specific family members, children, and pets later in your profile settings.</p>
        <p>This basic information helps MAGIS understand your household context.</p>
      </div>
    </div>
  );
}

// Preferences Step
function PreferencesStep({ formData, updateFormData }: any) {
  const preferences = formData.preferences || {};

  const updateField = (field: string, value: string) => {
    updateFormData('preferences', { communication: { ...preferences.communication, [field]: value } });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Communication preferences</h2>
        <p className="text-gray-600">How would you like MAGIS to interact with you?</p>
      </div>

      <div>
        <Label htmlFor="style">Communication Style</Label>
        <Select
          value={preferences.communication?.preferredStyle || ''}
          onValueChange={(value: string) => updateField('preferredStyle', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="How should MAGIS talk to you?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="formal">Formal and professional</SelectItem>
            <SelectItem value="friendly">Friendly and casual</SelectItem>
            <SelectItem value="concise">Brief and to the point</SelectItem>
            <SelectItem value="detailed">Detailed explanations</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="responseLength">Response Length</Label>
        <Select
          value={preferences.communication?.responseLength || ''}
          onValueChange={(value: string) => updateField('responseLength', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="How long should responses be?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="brief">Brief - Get to the point quickly</SelectItem>
            <SelectItem value="moderate">Moderate - Balanced responses</SelectItem>
            <SelectItem value="detailed">Detailed - Thorough explanations</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-gray-500 bg-green-50 p-4 rounded-md">
        <p><strong>Good to know:</strong> These preferences help MAGIS match your communication style, but you can change them anytime in settings.</p>
      </div>
    </div>
  );
}

// Complete Step
function CompleteStep({ onComplete }: any) {
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold mb-4">You're all set!</h2>
        <p className="text-gray-600 mb-6">
          MAGIS now has the context it needs to provide personalized assistance. 
          Your AI assistant will learn and improve over time as you interact.
        </p>
        <div className="text-sm text-gray-500 mb-8 space-y-2">
          <p>✓ Profile information saved securely</p>
          <p>✓ MAGIS ready for personalized conversations</p>
          <p>✓ You can update your profile anytime in settings</p>
        </div>
      </div>
      <Button onClick={onComplete} size="lg" className="w-full">
        Start Using MAGIS
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}