import React, { useState, useEffect } from 'react';
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
import { NeuralBackground } from '@/components/NeuralBackground';
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

  // State for Gmail OAuth tokens
  const [gmailTokens, setGmailTokens] = useState<{ accessToken: string; refreshToken?: string; expiry?: string } | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const { accessToken, refreshToken, expiry } = event.data.data;
        setGmailTokens({ accessToken, refreshToken, expiry });
        setFormData(prev => ({ ...prev, googleConnectorEmail: 'Connected via OAuth' })); // Visual feedback
        setGmailTokens({ accessToken, refreshToken, expiry });
        setFormData(prev => ({ ...prev, googleConnectorEmail: 'Connected via OAuth' })); // Visual feedback
        toast.success('Gmail connected successfully!');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Consent checkbox states
  const [consentRead, setConsentRead] = useState(false);
  const [consentSend, setConsentSend] = useState(false);
  const [consentControl, setConsentControl] = useState(false);
  const [consentTransparency, setConsentTransparency] = useState(false);

  // Auto-clear Gmail tokens after 5 minutes (security requirement)
  useEffect(() => {
    if (gmailTokens) {
      const timer = setTimeout(() => {
        setGmailTokens(null);
        setFormData(prev => ({ ...prev, googleConnectorEmail: '' }));
        toast.info('Gmail connection expired. Please connect again.', { duration: 5000 });
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearTimeout(timer);
    }
  }, [gmailTokens]);

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
    xApiKey: '',
    xApiKeySecret: '',
    xAccessToken: '',
    xAccessTokenSecret: '',
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

    // X Validations
    if (!formData.xApiKey.trim()) newErrors.xApiKey = 'Required';
    if (!formData.xApiKeySecret.trim()) newErrors.xApiKeySecret = 'Required';
    if (!formData.xAccessToken.trim()) newErrors.xAccessToken = 'Required';
    if (!formData.xAccessTokenSecret.trim()) newErrors.xAccessTokenSecret = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCoreFields = () => {
    const coreErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) coreErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) coreErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) coreErrors.email = 'Invalid email format';
    if (!formData.password) coreErrors.password = 'Password is required';
    else if (formData.password.length < 6) coreErrors.password = 'Password must be at least 6 characters';
    if (!formData.confirmPassword) coreErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) coreErrors.confirmPassword = 'Passwords do not match';
    if (!formData.businessName.trim()) coreErrors.businessName = 'Business name is required';
    if (!formData.industry) coreErrors.industry = 'Industry is required';
    if (!formData.region.trim()) coreErrors.region = 'Region is required';
    if (!formData.businessWebsite.trim()) coreErrors.businessWebsite = 'Business website is required';
    if (!formData.businessSize) coreErrors.businessSize = 'Business size is required';

    if (Object.keys(coreErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...coreErrors }));
      toast.error('Please fill in all mandatory details first');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    return true;
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

      xApiKey: formData.xApiKey,
      xApiKeySecret: formData.xApiKeySecret,
      xAccessToken: formData.xAccessToken,
      xAccessTokenSecret: formData.xAccessTokenSecret,

      // We need to pass X keys. The `UserData` interface likely needs update or we pass as any.
      // However, `signup` implementation in AuthContext likely takes Partial<UserData>.
      // I will assume `UserData` is flexible or I might need to update that file too.
      // For now, I'll pass them if I can, but I notice `UserData` usage.
      // Let's check where `UserData` is defined. It's imported.
      // I'll proceed assuming I can modify the object or that `UserData` allows index signature.
      // Wait, `UserData` is imported from context. I should stick to the structure map expected by backend.
      // The `signup` function calls `/register`.

      // For now, mapping X keys into the request payload logic in `Signup.tsx` 
      // will require `useAuth` hook update IF it strictly types the argument.
      // Let's look at `const { signup } = useAuth();` usage.
      // The `handleSubmit` calls `signup(userData, password)`.

      // I'll assume I can add properties or I should check `AuthContext.tsx`.
      // To save time/tokens, I'll inject them and if TS errors, I'll fix `AuthContext`.
      // But wait! `UserData` in line 198 is explicitly typed.
      // I should update `AuthContext.tsx` if I want to be TS correct.
      // HOWEVER, for this tool call, I will update `Signup.tsx` logic first.

      // Wait, I am replacing `linkedin` fields in `formData` state.
      // So I should replace them in the object passed to `signup`.



      googleConnectorEmail: formData.googleConnectorEmail,
      googleApiKey: formData.googleApiKey,
      defaultFromEmail: formData.defaultFromEmail,

      // Include Gmail tokens if available
      Gmail_Access_Token: gmailTokens?.accessToken,
      Gmail_Refresh_Token: gmailTokens?.refreshToken,
      Gmail_Token_Expiry: gmailTokens?.expiry,
    };

    // Remove LinkedIn keys from object if strict, or just leave empty strings if type requires them.
    // I will delete them from the object I construct if possible, but TS interface enforces keys.
    // I will check AuthContext next. For now, I am updating the FORM LOGIC.

    // ...

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
    <div className="min-h-screen flex flex-col relative">
      <NeuralBackground className="fixed inset-0 pointer-events-none" opacity={1} />

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
            <Collapsible
              open={connectorsOpen}
              onOpenChange={(isOpen) => {
                if (isOpen) {
                  if (validateCoreFields()) {
                    setConnectorsOpen(true);
                  }
                } else {
                  setConnectorsOpen(false);
                }
              }}
            >
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

                    {/* X (Twitter) */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-sm">X (Twitter)</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <InputWithError
                          id="xApiKey"
                          label="API Key"
                          placeholder="Your X API Key"
                          value={formData.xApiKey}
                          onChange={(v) => updateField('xApiKey', v)}
                          error={errors.xApiKey}
                        />
                        <InputWithError
                          id="xApiKeySecret"
                          label="API Key Secret"
                          placeholder="Your X API Key Secret"
                          value={formData.xApiKeySecret}
                          onChange={(v) => updateField('xApiKeySecret', v)}
                          error={errors.xApiKeySecret}
                        />
                        <InputWithError
                          id="xAccessToken"
                          label="Access Token"
                          placeholder="Your X Access Token"
                          value={formData.xAccessToken}
                          onChange={(v) => updateField('xAccessToken', v)}
                          error={errors.xAccessToken}
                        />
                        <InputWithError
                          id="xAccessTokenSecret"
                          label="Access Token Secret"
                          placeholder="Your X Access Token Secret"
                          value={formData.xAccessTokenSecret}
                          onChange={(v) => updateField('xAccessTokenSecret', v)}
                          error={errors.xAccessTokenSecret}
                        />
                      </div>
                    </div>

                    {/* Google */}
                    <div className="space-y-4">
                      <div className="space-y-1 mb-6">
                        <h3 className="font-semibold text-lg text-foreground">Connect your Gmail (Optional)</h3>
                        <p className="text-sm text-muted-foreground">
                          Allow SocialSphere AI to read specific emails to help you automate reminders, events, and insights.
                        </p>
                      </div>

                      <div className="bg-muted/30 p-4 rounded-xl space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-foreground">What access does SocialSphere AI need?</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            To help you automate reminders and send emails on your behalf, we need limited Gmail access — only with your permission.
                          </p>
                        </div>

                        <div className="space-y-3 pt-2">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <input
                                type="checkbox"
                                id="consentRead"
                                className="w-4 h-4 rounded border-primary text-primary focus:ring-primary"
                                checked={consentRead}
                                onChange={(e) => setConsentRead(e.target.checked)}
                              />
                            </div>
                            <label htmlFor="consentRead" className="text-sm text-muted-foreground leading-tight cursor-pointer pt-0.5">
                              Allow SocialSphere AI to read selected Gmail emails
                            </label>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <input
                                type="checkbox"
                                id="consentSend"
                                className="w-4 h-4 rounded border-primary text-primary focus:ring-primary"
                                checked={consentSend}
                                onChange={(e) => setConsentSend(e.target.checked)}
                              />
                            </div>
                            <label htmlFor="consentSend" className="text-sm text-muted-foreground leading-tight cursor-pointer pt-0.5">
                              Allow SocialSphere AI to send emails on my behalf
                            </label>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <input
                                type="checkbox"
                                id="consentControl"
                                className="w-4 h-4 rounded border-primary text-primary focus:ring-primary"
                                checked={consentControl}
                                onChange={(e) => setConsentControl(e.target.checked)}
                              />
                            </div>
                            <label htmlFor="consentControl" className="text-sm text-muted-foreground leading-tight cursor-pointer pt-0.5">
                              I understand that I stay in control
                            </label>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <input
                                type="checkbox"
                                id="consentTransparency"
                                className="w-4 h-4 rounded border-primary text-primary focus:ring-primary"
                                checked={consentTransparency}
                                onChange={(e) => setConsentTransparency(e.target.checked)}
                              />
                            </div>
                            <label htmlFor="consentTransparency" className="text-sm text-muted-foreground leading-tight cursor-pointer pt-0.5">
                              I understand how my Gmail data is used
                            </label>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!!gmailTokens}
                        className={gmailTokens
                          ? "w-full flex items-center justify-center gap-2 mt-4 border-green-500 text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                          : "w-full flex items-center justify-center gap-2 mt-4 border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"}
                        onClick={() => {
                          // Validate core fields AND other connector fields first
                          const validationErrors: Record<string, string> = {};

                          // Core validation
                          if (!formData.fullName.trim()) validationErrors.fullName = 'Full name is required';
                          if (!formData.email.trim()) validationErrors.email = 'Email is required';
                          else if (!/\S+@\S+\.\S+/.test(formData.email)) validationErrors.email = 'Invalid email format';
                          if (!formData.password) validationErrors.password = 'Password is required';
                          else if (formData.password.length < 6) validationErrors.password = 'Password must be at least 6 characters';
                          if (!formData.confirmPassword) validationErrors.confirmPassword = 'Please confirm your password';
                          else if (formData.password !== formData.confirmPassword) validationErrors.confirmPassword = 'Passwords do not match';
                          if (!formData.businessName.trim()) validationErrors.businessName = 'Business name is required';
                          if (!formData.industry) validationErrors.industry = 'Industry is required';
                          if (!formData.region.trim()) validationErrors.region = 'Region is required';
                          if (!formData.businessWebsite.trim()) validationErrors.businessWebsite = 'Business website is required';
                          if (!formData.businessSize) validationErrors.businessSize = 'Business size is required';

                          // Consent Checkbox Validation
                          if (!consentRead || !consentSend || !consentControl || !consentTransparency) {
                            toast.error('Please check all the consent boxes to proceed with Gmail connection.');
                            return;
                          }

                          // Other Connectors validation REMOVED to allow independent connection
                          // We only validate core fields here.

                          if (Object.keys(validationErrors).length > 0) {
                            setErrors(prev => ({ ...prev, ...validationErrors }));
                            toast.error('Please fill in all mandatory business details first');
                            // Scroll to top to show errors or find the first error
                            const firstErrorField = Object.keys(validationErrors)[0];
                            const element = document.getElementById(firstErrorField);
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              element.focus();
                            } else {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                            return;
                          }

                          const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
                          const redirectUri = import.meta.env.VITE_GOOGLE_OAUTH_REDIRECT_URI || "http://localhost:8000/auth/google/callback";

                          const scope = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send";
                          const responseType = "code";
                          const accessType = "offline";
                          const prompt = "consent";
                          const state = "signup";

                          const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&access_type=${accessType}&prompt=${prompt}&state=${state}`;

                          const width = 500;
                          const height = 600;
                          const left = window.screen.width / 2 - width / 2;
                          const top = window.screen.height / 2 - height / 2;

                          window.open(
                            authUrl,
                            'Google Connect',
                            `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=yes`
                          );
                        }}
                      >
                        {gmailTokens ? (
                          <>
                            <Check className="w-5 h-5" />
                            Gmail Connected
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335" />
                            </svg>
                            Connect Gmail
                          </>
                        )}
                      </Button>
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
        </div >
      </main >

      <Footer />
    </div >
  );
};

export default Signup;
