import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth, UserData } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { InputWithError } from '@/components/signup/InputWithError';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import {
  User,
  Building2,
  Palette,
  Link2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Check,
  X
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const industries = [
  'E-commerce', 'SaaS', 'Healthcare', 'Education', 'Finance',
  'Real Estate', 'Food & Beverage', 'Fashion', 'Technology', 'Other'
];

const businessSizes = ['Solo', '2-10', '10-50', '50+'];

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    industry: '',
    region: '',
    businessWebsite: '',
    businessSize: '',
    logoColor: '#3b82f6',
    logoFile: null as File | null,

    businessDocuments: [] as File[],
    instagramApiKey: '',
    instagramUserId: '',
    facebookApiKey: '',
    facebookPageId: '',
    linkedinAccessToken: '',
    linkedinAuthorUrl: '',
    googleConnectorEmail: '',
    googleApiKey: '',
    defaultFromEmail: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
  const passwordsDontMatch = formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword;

  const updateField = (field: string, value: string | File | File[] | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
    if (!formData.industry) newErrors.industry = 'Industry is required';
    if (!formData.region.trim()) newErrors.region = 'Region is required';
    if (!formData.businessWebsite.trim()) newErrors.businessWebsite = 'Business website is required';
    if (!formData.businessSize) newErrors.businessSize = 'Business size is required';

    // Connector validations
    if (!formData.instagramApiKey.trim()) newErrors.instagramApiKey = 'Required';
    if (!formData.instagramUserId.trim()) newErrors.instagramUserId = 'Required';
    if (!formData.facebookApiKey.trim()) newErrors.facebookApiKey = 'Required';
    if (!formData.facebookPageId.trim()) newErrors.facebookPageId = 'Required';
    if (!formData.linkedinAccessToken.trim()) newErrors.linkedinAccessToken = 'Required';
    if (!formData.linkedinAuthorUrl.trim()) newErrors.linkedinAuthorUrl = 'Required';
    if (!formData.googleConnectorEmail.trim()) newErrors.googleConnectorEmail = 'Required';
    if (!formData.googleApiKey.trim()) newErrors.googleApiKey = 'Required';
    if (!formData.defaultFromEmail.trim()) newErrors.defaultFromEmail = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setConnectorsOpen(true);
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    const userData: UserData = {
      fullName: formData.fullName,
      email: formData.email,
      businessName: formData.businessName,
      industry: formData.industry,
      region: formData.region,
      businessWebsite: formData.businessWebsite,
      businessSize: formData.businessSize,
      logoColor: formData.logoColor,
      logoFile: formData.logoFile?.name,

      businessDocuments: formData.businessDocuments,
      instagramApiKey: formData.instagramApiKey,
      instagramUserId: formData.instagramUserId,
      facebookApiKey: formData.facebookApiKey,
      facebookPageId: formData.facebookPageId,
      linkedinAccessToken: formData.linkedinAccessToken,
      linkedinAuthorUrl: formData.linkedinAuthorUrl,
      googleConnectorEmail: formData.googleConnectorEmail,
      googleApiKey: formData.googleApiKey,
      defaultFromEmail: formData.defaultFromEmail,
    };

    const success = await signup(userData, formData.password);

    if (success) {
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } else {
      toast.error('An account with this email already exists');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <LoadingOverlay
        isLoading={loading}
        message="Creating Your AI Marketing Team"
        subMessage="Analyzing your business documents to customize your experience..."
      />
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">Create Your Account</h1>
            <p className="text-muted-foreground">
              Set up your AI marketing department in minutes
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* User Information */}
            <div className="p-6 rounded-2xl bg-card border border-border/50 card-shadow">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
                <h2 className="text-lg font-display font-semibold">User Information</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <InputWithError
                  id="fullName"
                  label="Full Name"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(v) => updateField('fullName', v)}
                  error={errors.fullName}
                />
                <InputWithError
                  id="email"
                  label="Email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(v) => updateField('email', v)}
                  error={errors.email}
                />
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      className={errors.password ? 'border-destructive' : ''}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      className={errors.confirmPassword ? 'border-destructive' : ''}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {passwordsMatch && <Check className="w-4 h-4 text-green-500" />}
                      {passwordsDontMatch && <X className="w-4 h-4 text-destructive" />}
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="p-6 rounded-2xl bg-card border border-border/50 card-shadow">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary-foreground" />
                </div>
                <h2 className="text-lg font-display font-semibold">Business Information</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <InputWithError
                  id="businessName"
                  label="Business Name"
                  placeholder="Acme Inc."
                  value={formData.businessName}
                  onChange={(v) => updateField('businessName', v)}
                  error={errors.businessName}
                />
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Industry <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.industry} onValueChange={(v) => updateField('industry', v)}>
                    <SelectTrigger className={errors.industry ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map(industry => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.industry && <p className="text-xs text-destructive">{errors.industry}</p>}
                </div>
                <InputWithError
                  id="region"
                  label="Region / Country"
                  placeholder="United States"
                  value={formData.region}
                  onChange={(v) => updateField('region', v)}
                  error={errors.region}
                />
                <InputWithError
                  id="businessWebsite"
                  label="Business Website"
                  placeholder="https://example.com"
                  value={formData.businessWebsite}
                  onChange={(v) => updateField('businessWebsite', v)}
                  error={errors.businessWebsite}
                />
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Business Size <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.businessSize} onValueChange={(v) => updateField('businessSize', v)}>
                    <SelectTrigger className={errors.businessSize ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessSizes.map(size => (
                        <SelectItem key={size} value={size}>{size} employees</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.businessSize && <p className="text-xs text-destructive">{errors.businessSize}</p>}
                </div>
              </div>
            </div>

            {/* Branding Information */}
            <div className="p-6 rounded-2xl bg-card border border-border/50 card-shadow">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                  <Palette className="w-4 h-4 text-primary-foreground" />
                </div>
                <h2 className="text-lg font-display font-semibold">Branding Information</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Brand Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.logoColor}
                      onChange={(e) => updateField('logoColor', e.target.value)}
                      className="w-12 h-10 rounded-lg cursor-pointer border border-border"
                    />
                    <Input
                      value={formData.logoColor}
                      onChange={(e) => updateField('logoColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Company Logo</Label>
                  <div className="relative">
                    <Input
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg"
                      onChange={(e) => updateField('logoFile', e.target.files?.[0] || null)}
                      className="file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                  </div>
                  {formData.logoFile && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-500" />
                      {formData.logoFile.name}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label className="text-sm font-medium">Business Overview Documents (Max 10 files)</Label>
                  <div className="relative">
                    <Input
                      type="file"
                      accept=".pdf,.csv,.xlsx,.docx,.txt"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          const files = Array.from(e.target.files);
                          if (files.length > 10) {
                            toast.error('Maximum 10 files allowed');
                            e.target.value = ''; // Reset input
                            return;
                          }
                          updateField('businessDocuments', files);
                        }
                      }}
                      className="file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                  </div>
                  {formData.businessDocuments.length > 0 && (
                    <div className="space-y-1">
                      {formData.businessDocuments.map((file, index) => (
                        <p key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                          <Check className="w-3 h-3 text-green-500" />
                          {file.name}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Connector Inputs */}
            <Collapsible open={connectorsOpen} onOpenChange={setConnectorsOpen}>
              <div className="p-6 rounded-2xl bg-card border border-border/50 card-shadow">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                        <Link2 className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <h2 className="text-lg font-display font-semibold">Platform Connectors</h2>
                    </div>
                    {connectorsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-6">
                  <p className="text-sm text-muted-foreground mb-6">
                    Connect your social media and email platforms to enable automated posting and campaigns.
                  </p>

                  <div className="space-y-6">
                    {/* Instagram */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-sm">Instagram</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <InputWithError
                          id="instagramApiKey"
                          label="API Key"
                          placeholder="Your Instagram API Key"
                          value={formData.instagramApiKey}
                          onChange={(v) => updateField('instagramApiKey', v)}
                          error={errors.instagramApiKey}
                        />
                        <InputWithError
                          id="instagramUserId"
                          label="Business User ID"
                          placeholder="Business User ID"
                          value={formData.instagramUserId}
                          onChange={(v) => updateField('instagramUserId', v)}
                          error={errors.instagramUserId}
                        />
                      </div>
                    </div>

                    {/* Facebook */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-sm">Facebook</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <InputWithError
                          id="facebookApiKey"
                          label="API Key"
                          placeholder="Your Facebook API Key"
                          value={formData.facebookApiKey}
                          onChange={(v) => updateField('facebookApiKey', v)}
                          error={errors.facebookApiKey}
                        />
                        <InputWithError
                          id="facebookPageId"
                          label="Page ID"
                          placeholder="Facebook Page ID"
                          value={formData.facebookPageId}
                          onChange={(v) => updateField('facebookPageId', v)}
                          error={errors.facebookPageId}
                        />
                      </div>
                    </div>

                    {/* LinkedIn */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-sm">LinkedIn</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <InputWithError
                          id="linkedinAccessToken"
                          label="Access Token"
                          placeholder="Your LinkedIn Access Token"
                          value={formData.linkedinAccessToken}
                          onChange={(v) => updateField('linkedinAccessToken', v)}
                          error={errors.linkedinAccessToken}
                        />
                        <InputWithError
                          id="linkedinAuthorUrl"
                          label="Author URN"
                          placeholder="urn:li:person:xxxx"
                          value={formData.linkedinAuthorUrl}
                          onChange={(v) => updateField('linkedinAuthorUrl', v)}
                          error={errors.linkedinAuthorUrl}
                        />
                      </div>
                    </div>

                    {/* Google */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-sm">Google / Gmail</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <InputWithError
                          id="googleConnectorEmail"
                          label="Connector Email"
                          placeholder="connector@gmail.com"
                          value={formData.googleConnectorEmail}
                          onChange={(v) => updateField('googleConnectorEmail', v)}
                          error={errors.googleConnectorEmail}
                        />
                        <InputWithError
                          id="googleApiKey"
                          label="API Key"
                          placeholder="Your Google API Key"
                          value={formData.googleApiKey}
                          onChange={(v) => updateField('googleApiKey', v)}
                          error={errors.googleApiKey}
                        />
                        <InputWithError
                          id="defaultFromEmail"
                          label="Default From Email"
                          placeholder="noreply@yourdomain.com"
                          value={formData.defaultFromEmail}
                          onChange={(v) => updateField('defaultFromEmail', v)}
                          error={errors.defaultFromEmail}
                        />
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            <Button type="submit" variant="hero" size="xl" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Login
              </Link>
            </p>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Signup;
