'use client'

import Link from 'next/link'
import { ArrowLeft, Cookie, Settings, Eye, BarChart3, Shield, Globe } from 'lucide-react'

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-dark-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
              <Cookie className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">Cookie Policy</h1>
          </div>
          <p className="text-gray-400 text-lg">
            This Cookie Policy explains how Club Nightlife uses cookies and similar tracking technologies on our website and services.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Last Updated: November 11, 2025
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                <Cookie className="h-5 w-5 text-primary-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">1. What Are Cookies?</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide a better user experience.
                  </p>
                  <p>
                    Cookies allow websites to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Remember your login information and preferences</li>
                    <li>Understand how you use the website</li>
                    <li>Improve website functionality and performance</li>
                    <li>Deliver personalized content and advertisements</li>
                    <li>Analyze website traffic and user behavior</li>
                  </ul>
                  <p className="mt-4">
                    Similar technologies include web beacons, pixels, and local storage, which serve similar purposes to cookies.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Settings className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">2. Types of Cookies We Use</h2>
                <div className="space-y-6 text-gray-300">

                  {/* Essential Cookies */}
                  <div className="bg-dark-900/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-400" />
                      Essential Cookies
                    </h3>
                    <p className="mb-2">
                      These cookies are necessary for the website to function properly. They enable basic functions like page navigation, access to secure areas, and authentication.
                    </p>
                    <p className="text-sm text-gray-400">
                      <strong>Examples:</strong> Session cookies, authentication cookies, security cookies
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      <strong>Duration:</strong> Session or up to 1 year
                    </p>
                    <p className="text-sm text-yellow-400 mt-2">
                      Note: These cookies cannot be disabled as they are essential for the service to work.
                    </p>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="bg-dark-900/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-400" />
                      Analytics and Performance Cookies
                    </h3>
                    <p className="mb-2">
                      These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our service.
                    </p>
                    <p className="text-sm text-gray-400">
                      <strong>Examples:</strong> Google Analytics, Mixpanel, custom analytics
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      <strong>Duration:</strong> Up to 2 years
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      <strong>Data Collected:</strong> Page views, session duration, bounce rate, user flow, device information
                    </p>
                  </div>

                  {/* Functional Cookies */}
                  <div className="bg-dark-900/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <Settings className="h-5 w-5 text-purple-400" />
                      Functional Cookies
                    </h3>
                    <p className="mb-2">
                      These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.
                    </p>
                    <p className="text-sm text-gray-400">
                      <strong>Examples:</strong> Language preferences, theme settings, dashboard customization
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      <strong>Duration:</strong> Up to 1 year
                    </p>
                  </div>

                  {/* Marketing Cookies */}
                  <div className="bg-dark-900/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <Eye className="h-5 w-5 text-pink-400" />
                      Marketing and Targeting Cookies
                    </h3>
                    <p className="mb-2">
                      These cookies are used to deliver advertisements more relevant to you and your interests. They may also be used to limit the number of times you see an advertisement.
                    </p>
                    <p className="text-sm text-gray-400">
                      <strong>Examples:</strong> Facebook Pixel, Google Ads, LinkedIn Insight Tag
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      <strong>Duration:</strong> Up to 2 years
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      <strong>Data Collected:</strong> Browsing behavior, ad interactions, conversion tracking
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                <Globe className="h-5 w-5 text-pink-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">3. Third-Party Cookies</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    In addition to our own cookies, we use various third-party cookies to provide enhanced functionality and analyze usage:
                  </p>

                  <div className="space-y-3">
                    <div className="bg-dark-900/50 rounded-lg p-4">
                      <p className="font-semibold text-white">Google Analytics</p>
                      <p className="text-sm text-gray-400 mt-1">
                        We use Google Analytics to analyze website traffic and usage patterns. Google Analytics uses cookies to collect information about how visitors use our site.
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Privacy Policy: <a href="https://policies.google.com/privacy" className="text-primary-400 hover:text-primary-300" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy</a>
                      </p>
                    </div>

                    <div className="bg-dark-900/50 rounded-lg p-4">
                      <p className="font-semibold text-white">Stripe (Payment Processing)</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Stripe uses cookies to process payments securely and prevent fraud.
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Privacy Policy: <a href="https://stripe.com/privacy" className="text-primary-400 hover:text-primary-300" target="_blank" rel="noopener noreferrer">https://stripe.com/privacy</a>
                      </p>
                    </div>

                    <div className="bg-dark-900/50 rounded-lg p-4">
                      <p className="font-semibold text-white">Intercom (Customer Support)</p>
                      <p className="text-sm text-gray-400 mt-1">
                        We use Intercom for customer support and communication. Intercom uses cookies to provide chat functionality and track support interactions.
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Privacy Policy: <a href="https://www.intercom.com/legal/privacy" className="text-primary-400 hover:text-primary-300" target="_blank" rel="noopener noreferrer">https://www.intercom.com/legal/privacy</a>
                      </p>
                    </div>

                    <div className="bg-dark-900/50 rounded-lg p-4">
                      <p className="font-semibold text-white">Social Media Platforms</p>
                      <p className="text-sm text-gray-400 mt-1">
                        We may use social media cookies from platforms like Facebook, Twitter, and LinkedIn for social sharing features and targeted advertising.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Settings className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">4. How to Control Cookies</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    You have several options to control or limit how cookies are used:
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-white mb-2">Browser Settings</h3>
                      <p className="mb-2">
                        Most web browsers allow you to control cookies through their settings. You can:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                        <li>Block all cookies</li>
                        <li>Accept only first-party cookies</li>
                        <li>Delete cookies after each browsing session</li>
                        <li>View and delete specific cookies</li>
                      </ul>
                      <p className="text-sm text-gray-400 mt-2">
                        Note: Blocking essential cookies may prevent you from using certain features of our website.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-white mb-2">Cookie Preference Center</h3>
                      <p>
                        When you first visit our website, you&apos;ll see a cookie banner where you can manage your preferences. You can also update your preferences at any time through our Cookie Preference Center.
                      </p>
                      <button className="mt-3 px-4 py-2 bg-primary-500/20 border border-primary-500/50 rounded-lg text-primary-300 hover:bg-primary-500/30 transition text-sm">
                        Manage Cookie Preferences
                      </button>
                    </div>

                    <div>
                      <h3 className="font-semibold text-white mb-2">Opt-Out Tools</h3>
                      <p className="mb-2">You can opt out of specific third-party cookies:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                        <li>Google Analytics: <a href="https://tools.google.com/dlpage/gaoptout" className="text-primary-400 hover:text-primary-300" target="_blank" rel="noopener noreferrer">https://tools.google.com/dlpage/gaoptout</a></li>
                        <li>Network Advertising Initiative: <a href="http://www.networkadvertising.org/choices/" className="text-primary-400 hover:text-primary-300" target="_blank" rel="noopener noreferrer">http://www.networkadvertising.org/choices/</a></li>
                        <li>Digital Advertising Alliance: <a href="http://www.aboutads.info/choices/" className="text-primary-400 hover:text-primary-300" target="_blank" rel="noopener noreferrer">http://www.aboutads.info/choices/</a></li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-white mb-2">Do Not Track</h3>
                      <p>
                        Some browsers include a &quot;Do Not Track&quot; (DNT) feature. Currently, there is no industry standard for how to respond to DNT signals. Our website does not currently respond to DNT signals.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">5. Cookie Lifespan</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    Cookies can be either &quot;session&quot; cookies or &quot;persistent&quot; cookies:
                  </p>
                  <div className="space-y-3">
                    <div className="bg-dark-900/50 rounded-lg p-4">
                      <p className="font-semibold text-white">Session Cookies</p>
                      <p className="text-sm text-gray-400 mt-1">
                        These temporary cookies expire when you close your browser. They are used to maintain your session as you navigate through our website.
                      </p>
                    </div>
                    <div className="bg-dark-900/50 rounded-lg p-4">
                      <p className="font-semibold text-white">Persistent Cookies</p>
                      <p className="text-sm text-gray-400 mt-1">
                        These cookies remain on your device for a set period (ranging from a few days to several years) or until you manually delete them. They remember your preferences and actions across multiple visits.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Globe className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">6. Mobile Devices</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    In addition to cookies, we may use other technologies on mobile devices, including:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Mobile Device Identifiers:</strong> Unique identifiers assigned to your mobile device</li>
                    <li><strong>SDK Analytics:</strong> Software development kits that collect usage data</li>
                    <li><strong>Local Storage:</strong> Data stored locally on your device</li>
                  </ul>
                  <p className="mt-4">
                    You can control these through your device settings:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li><strong>iOS:</strong> Settings → Privacy → Tracking</li>
                    <li><strong>Android:</strong> Settings → Google → Ads → Opt out of Ads Personalization</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <Eye className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">7. Updates to This Policy</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.
                  </p>
                  <p>
                    We will notify you of any material changes by:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Updating the &quot;Last Updated&quot; date at the top of this policy</li>
                    <li>Displaying a prominent notice on our website</li>
                    <li>Sending you an email notification (if you have an account)</li>
                  </ul>
                  <p className="mt-4">
                    We encourage you to review this Cookie Policy periodically to stay informed about how we use cookies.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <Settings className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">8. Contact Us</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    If you have any questions about our use of cookies or this Cookie Policy, please contact us:
                  </p>
                  <div className="bg-dark-900/50 rounded-lg p-4 space-y-2">
                    <p><strong>Email:</strong> privacy@clubnightlife.com</p>
                    <p><strong>Mail:</strong> Club Nightlife Privacy Team, 123 Tech Street, San Francisco, CA 94105</p>
                    <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                  </div>
                  <p className="mt-4 text-sm">
                    For more information about how we protect your privacy, please see our <Link href="/privacy" className="text-primary-400 hover:text-primary-300">Privacy Policy</Link>.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Quick Reference Table */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Reference: Cookie Summary</h2>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-dark-900/50 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-white font-semibold">Cookie Type</th>
                    <th className="px-4 py-3 text-left text-white font-semibold">Purpose</th>
                    <th className="px-4 py-3 text-left text-white font-semibold">Duration</th>
                    <th className="px-4 py-3 text-left text-white font-semibold">Can be Disabled?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  <tr>
                    <td className="px-4 py-3 text-gray-300">Essential</td>
                    <td className="px-4 py-3 text-gray-400">Core functionality</td>
                    <td className="px-4 py-3 text-gray-400">Session - 1 year</td>
                    <td className="px-4 py-3 text-red-400">No</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-gray-300">Analytics</td>
                    <td className="px-4 py-3 text-gray-400">Usage tracking</td>
                    <td className="px-4 py-3 text-gray-400">Up to 2 years</td>
                    <td className="px-4 py-3 text-green-400">Yes</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-gray-300">Functional</td>
                    <td className="px-4 py-3 text-gray-400">Preferences</td>
                    <td className="px-4 py-3 text-gray-400">Up to 1 year</td>
                    <td className="px-4 py-3 text-green-400">Yes</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-gray-300">Marketing</td>
                    <td className="px-4 py-3 text-gray-400">Advertising</td>
                    <td className="px-4 py-3 text-gray-400">Up to 2 years</td>
                    <td className="px-4 py-3 text-green-400">Yes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Back to Top */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
