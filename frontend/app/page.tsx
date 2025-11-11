'use client'

import {
  Sparkles,
  QrCode,
  Trophy,
  BarChart3,
  Check,
  X,
  ChevronDown,
  Menu,
  Zap,
  Shield,
  Users,
  TrendingUp,
  Star,
  Github,
  Twitter,
  Linkedin,
  ArrowRight
} from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface PricingTier {
  name: string
  price: number
  description: string
  features: string[]
  notIncluded?: string[]
  popular?: boolean
  cta: string
}

interface FAQ {
  question: string
  answer: string
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const pricingTiers: PricingTier[] = [
    {
      name: 'Basic',
      price: 49,
      description: 'Perfect for small clubs getting started',
      features: [
        'QR Code Check-ins',
        'Up to 500 members',
        'Basic analytics dashboard',
        'Email support',
        'Mobile app access',
        '1 location'
      ],
      notIncluded: [
        'Loyalty points system',
        'Advanced analytics',
        'Priority support'
      ],
      cta: 'Start Basic Trial'
    },
    {
      name: 'Pro',
      price: 149,
      description: 'For growing clubs with ambitious goals',
      features: [
        'Everything in Basic',
        'Up to 5,000 members',
        'Loyalty points system',
        'Advanced analytics',
        'SMS notifications',
        'Priority support',
        'Up to 3 locations',
        'Custom branding',
        'API access'
      ],
      popular: true,
      cta: 'Start Pro Trial'
    },
    {
      name: 'Premium',
      price: 349,
      description: 'For established venues needing enterprise features',
      features: [
        'Everything in Pro',
        'Unlimited members',
        'White-label solution',
        'Dedicated account manager',
        '24/7 phone support',
        'Unlimited locations',
        'Custom integrations',
        'Advanced security features',
        'Custom reporting',
        'Onboarding & training'
      ],
      cta: 'Contact Sales'
    }
  ]

  const faqs: FAQ[] = [
    {
      question: 'How does the free trial work?',
      answer: 'Start with a 14-day free trial of any plan. No credit card required. You can upgrade, downgrade, or cancel anytime during or after the trial period.'
    },
    {
      question: 'Can I change plans later?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any billing adjustments.'
    },
    {
      question: 'What happens to my data if I cancel?',
      answer: 'Your data is yours. You can export all your data at any time. After cancellation, we retain your data for 30 days in case you want to reactivate.'
    },
    {
      question: 'Do you offer custom enterprise solutions?',
      answer: 'Absolutely! Our Premium plan includes custom integrations and dedicated support. Contact our sales team for enterprise requirements and volume discounts.'
    },
    {
      question: 'Is there a setup fee?',
      answer: 'No setup fees for any plan. We include free onboarding and training for Pro and Premium plans to help you get started quickly.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, ACH transfers, and wire transfers for annual plans. All payments are processed securely through Stripe.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-primary-400" />
              <span className="text-xl font-bold text-white">Club Nightlife</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-300 hover:text-white transition">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-300 hover:text-white transition">
                Pricing
              </Link>
              <Link href="#faq" className="text-gray-300 hover:text-white transition">
                FAQ
              </Link>
              <button className="px-4 py-2 text-gray-300 hover:text-white transition">
                Sign In
              </button>
              <button className="px-6 py-2 bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition">
                Start Free Trial
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden glass border-t border-white/10">
            <div className="px-4 pt-2 pb-3 space-y-1">
              <Link href="#features" className="block px-3 py-2 text-gray-300 hover:text-white">
                Features
              </Link>
              <Link href="#pricing" className="block px-3 py-2 text-gray-300 hover:text-white">
                Pricing
              </Link>
              <Link href="#faq" className="block px-3 py-2 text-gray-300 hover:text-white">
                FAQ
              </Link>
              <button className="w-full text-left px-3 py-2 text-gray-300 hover:text-white">
                Sign In
              </button>
              <button className="w-full px-6 py-2 mt-2 bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg font-semibold">
                Start Free Trial
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            <div className="inline-block">
              <span className="glass px-4 py-2 rounded-full text-sm font-medium text-primary-400 border border-primary-500/20">
                <Zap className="inline h-4 w-4 mr-2" />
                The Future of Nightclub Management
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              Transform Your Nightclub
              <br />
              <span className="text-gradient">Operations Overnight</span>
            </h1>

            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Say goodbye to paper lists and manual tracking. Club Nightlife brings modern
              technology to your venue with QR check-ins, automated loyalty programs, and
              real-time analytics that drive revenue.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="group px-8 py-4 bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg font-semibold text-lg hover:shadow-2xl hover:shadow-primary-500/50 transition flex items-center gap-2 glow">
                Start Free Trial
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition" />
              </button>
              <button className="px-8 py-4 glass rounded-lg font-semibold text-lg hover:bg-white/10 transition">
                Watch Demo
              </button>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Mockup */}
          <div className="mt-20 relative">
            <div className="glass rounded-2xl p-4 glow">
              <div className="bg-gradient-to-br from-dark-800 to-dark-900 rounded-xl aspect-video flex items-center justify-center border border-white/10">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    <QrCode className="h-16 w-16 text-primary-400" />
                    <BarChart3 className="h-16 w-16 text-purple-400" />
                    <Trophy className="h-16 w-16 text-pink-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Platform Dashboard Preview</p>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-10 -left-10 glass rounded-2xl p-6 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <Check className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Check-in Complete</div>
                  <div className="text-xs text-gray-400">John Doe verified</div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-10 -right-10 glass rounded-2xl p-6 hidden lg:block">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary-400" />
                <div>
                  <div className="text-2xl font-bold text-white">+127%</div>
                  <div className="text-xs text-gray-400">Revenue increase</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="py-12 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-gradient">500+</div>
              <div className="text-gray-400 mt-2">Clubs Worldwide</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gradient">100K+</div>
              <div className="text-gray-400 mt-2">Active Members</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gradient">1M+</div>
              <div className="text-gray-400 mt-2">Check-ins Monthly</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gradient">99.9%</div>
              <div className="text-gray-400 mt-2">Uptime SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need to
              <span className="text-gradient"> Scale Your Venue</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful features designed specifically for modern nightclub operations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: QR Check-ins */}
            <div className="glass rounded-2xl p-8 hover:bg-white/10 transition group">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <QrCode className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">QR Code Check-ins</h3>
              <p className="text-gray-400 mb-6">
                Eliminate long lines and paper lists. Members scan their unique QR code
                for instant entry. Track attendance in real-time with our lightning-fast
                verification system.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Instant verification in under 1 second</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Works offline with sync when connected</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Fraud detection & duplicate prevention</span>
                </li>
              </ul>
            </div>

            {/* Feature 2: Loyalty Points */}
            <div className="glass rounded-2xl p-8 hover:bg-white/10 transition group">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Trophy className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Loyalty Rewards</h3>
              <p className="text-gray-400 mb-6">
                Keep your best customers coming back. Automatically award points for
                visits, spending, and referrals. Create custom rewards and tier systems
                that drive repeat business.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Automated point calculation & tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Multi-tier VIP membership levels</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Custom rewards & redemption rules</span>
                </li>
              </ul>
            </div>

            {/* Feature 3: Analytics */}
            <div className="glass rounded-2xl p-8 hover:bg-white/10 transition group">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Real-time Analytics</h3>
              <p className="text-gray-400 mb-6">
                Make data-driven decisions with comprehensive insights. Track attendance
                patterns, revenue metrics, and member behavior. Export reports for
                accounting and marketing.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Live dashboard with key metrics</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Custom reports & scheduled exports</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Predictive insights & recommendations</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Additional features grid */}
          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass rounded-xl p-6">
              <Shield className="h-8 w-8 text-primary-400 mb-3" />
              <h4 className="text-lg font-semibold text-white mb-2">Enterprise Security</h4>
              <p className="text-sm text-gray-400">Bank-level encryption and compliance</p>
            </div>
            <div className="glass rounded-xl p-6">
              <Users className="h-8 w-8 text-purple-400 mb-3" />
              <h4 className="text-lg font-semibold text-white mb-2">Team Management</h4>
              <p className="text-sm text-gray-400">Role-based access control</p>
            </div>
            <div className="glass rounded-xl p-6">
              <Zap className="h-8 w-8 text-pink-400 mb-3" />
              <h4 className="text-lg font-semibold text-white mb-2">API Integration</h4>
              <p className="text-sm text-gray-400">Connect with your existing tools</p>
            </div>
            <div className="glass rounded-xl p-6">
              <Star className="h-8 w-8 text-yellow-400 mb-3" />
              <h4 className="text-lg font-semibold text-white mb-2">24/7 Support</h4>
              <p className="text-sm text-gray-400">We're here when you need us</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-dark-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, Transparent
              <span className="text-gradient"> Pricing</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Choose the plan that fits your venue. All plans include 14-day free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`glass rounded-2xl p-8 relative ${
                  tier.popular
                    ? 'border-2 border-primary-500 shadow-2xl shadow-primary-500/20'
                    : 'border border-white/10'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-primary-500 to-purple-500 px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                  <p className="text-gray-400 text-sm">{tier.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-white">${tier.price}</span>
                    <span className="text-gray-400 ml-2">/month</span>
                  </div>
                </div>

                <button
                  className={`w-full py-3 rounded-lg font-semibold mb-6 transition ${
                    tier.popular
                      ? 'bg-gradient-to-r from-primary-500 to-purple-500 hover:shadow-lg hover:shadow-primary-500/50'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {tier.cta}
                </button>

                <div className="space-y-3">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                  {tier.notIncluded?.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <X className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-gray-400 mb-4">
              All plans include core features, mobile apps, and regular updates
            </p>
            <button className="text-primary-400 hover:text-primary-300 font-semibold">
              Compare all features →
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Frequently Asked
              <span className="text-gradient"> Questions</span>
            </h2>
            <p className="text-xl text-gray-400">
              Everything you need to know about Club Nightlife
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="glass rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition"
                >
                  <span className="font-semibold text-white pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center glass rounded-xl p-8">
            <h3 className="text-xl font-semibold text-white mb-2">Still have questions?</h3>
            <p className="text-gray-400 mb-4">
              Our team is here to help you get started
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg font-semibold hover:shadow-lg transition">
              Contact Support
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-900/20 via-purple-900/20 to-pink-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your
            <span className="text-gradient"> Nightclub?</span>
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join 500+ clubs worldwide using Club Nightlife to streamline operations
            and increase revenue. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="group px-8 py-4 bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg font-semibold text-lg hover:shadow-2xl hover:shadow-primary-500/50 transition flex items-center gap-2 glow">
              Start Free Trial
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition" />
            </button>
            <button className="px-8 py-4 glass rounded-lg font-semibold text-lg hover:bg-white/10 transition">
              Schedule Demo
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-8 w-8 text-primary-400" />
                <span className="text-xl font-bold text-white">Club Nightlife</span>
              </div>
              <p className="text-gray-400 text-sm">
                Modern nightclub management platform trusted by venues worldwide.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition text-sm">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition text-sm">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">Security</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">Roadmap</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">Contact</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">API Reference</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">Support</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition text-sm">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 Club Nightlife. All rights reserved.
            </p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition text-sm">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition text-sm">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
