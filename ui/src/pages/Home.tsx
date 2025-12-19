import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  Bot,
  Mail,
  Image,
  Calendar,
  Zap,
  Target,
  BarChart3,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

import { NeuralBackground } from '@/components/NeuralBackground';

const features = [
  {
    icon: Bot,
    title: 'Multi-Agent System',
    description: 'Coordinated AI agents work together to manage your entire marketing workflow.',
  },
  {
    icon: Sparkles,
    title: 'LLM-Powered Copy',
    description: 'Advanced language models craft compelling content tailored to your brand voice.',
  },
  {
    icon: Image,
    title: 'AI Image Generation',
    description: 'Create stunning posters, banners, and social media visuals automatically.',
  },
  {
    icon: Target,
    title: 'RAG Personalization',
    description: 'Vector database-powered context keeps your content relevant and on-brand.',
  },
  {
    icon: Mail,
    title: 'Email & Social APIs',
    description: 'Direct integration with Gmail, LinkedIn, Instagram, and Facebook.',
  },
  {
    icon: Calendar,
    title: 'Weekly Marketing Plans',
    description: 'Automated content calendars with strategic scheduling for maximum impact.',
  },
];


const Home: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 pt-16">
        <section className="relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 gradient-hero-bg" />
          {/* Increased opacity for visibility, offset to right */}
          <NeuralBackground className="absolute inset-0" opacity={1} centerX={0.75} />

          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />

          <div className="container mx-auto px-4 py-24 md:py-32 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-8 animate-fade-in">
                <Zap className="w-4 h-4" />
                <span>AI-Powered Marketing Automation</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                Your Complete{' '}
                <span className="gradient-text">AI Marketing</span>{' '}
                Department
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
                A plug-and-play AI marketing department in a box — automated social media,
                email campaigns, stunning creatives, and weekly marketing plans designed for MSMEs.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <Button asChild variant="hero" size="xl">
                  <Link to="/signup">
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="glass" size="xl">
                  <Link to="/login">
                    Login
                  </Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 mt-16 max-w-xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="text-center">
                  <div className="text-3xl font-display font-bold gradient-text">24/7</div>
                  <div className="text-sm text-muted-foreground">AI Available</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-display font-bold gradient-text">10x</div>
                  <div className="text-sm text-muted-foreground">Faster Content</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-display font-bold gradient-text">100%</div>
                  <div className="text-sm text-muted-foreground">Automated</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 border-t border-border/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Everything You Need to{' '}
                <span className="gradient-text">Scale Your Marketing</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                SocialSphere AI automates your marketing: posts, emails, posters, and weekly plans —
                a full marketing team powered by AI.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="group p-6 rounded-2xl bg-card border border-border/50 card-shadow hover:elevated-shadow transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-display font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 gradient-hero-bg" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                Ready to Transform Your Marketing?
              </h2>
              <p className="text-muted-foreground mb-8">
                Join businesses using SocialSphere AI to automate their entire marketing department.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild variant="hero" size="lg">
                  <Link to="/signup">
                    Start Free Trial
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
