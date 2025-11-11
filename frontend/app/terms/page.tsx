'use client'

import Link from 'next/link'
import { ArrowLeft, FileText, Scale, AlertTriangle, CheckCircle, XCircle, DollarSign } from 'lucide-react'

export default function TermsOfServicePage() {
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
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">Terms of Service</h1>
          </div>
          <p className="text-gray-400 text-lg">
            These Terms of Service govern your use of Club Nightlife&apos;s platform and services. Please read them carefully.
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
                <CheckCircle className="h-5 w-5 text-primary-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    By accessing or using Club Nightlife&apos;s services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use our services.
                  </p>
                  <p>
                    These Terms constitute a legally binding agreement between you (either an individual or a legal entity) and Club Nightlife Inc. (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">2. Description of Service</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    Club Nightlife provides a comprehensive nightclub management platform that includes:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>QR code-based member check-in system</li>
                    <li>Loyalty points and rewards management</li>
                    <li>Real-time analytics and reporting</li>
                    <li>Member database management</li>
                    <li>Mobile and web applications</li>
                    <li>API access for integrations (on select plans)</li>
                  </ul>
                  <p className="mt-4">
                    We reserve the right to modify, suspend, or discontinue any part of the service at any time with or without notice. We will not be liable to you or any third party for any modification, suspension, or discontinuance of the service.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                <Scale className="h-5 w-5 text-pink-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">3. User Accounts and Registration</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    To use our services, you must:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Be at least 18 years of age</li>
                    <li>Provide accurate, current, and complete information during registration</li>
                    <li>Maintain and update your information to keep it accurate and current</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Accept responsibility for all activities that occur under your account</li>
                    <li>Notify us immediately of any unauthorized use of your account</li>
                  </ul>
                  <p className="mt-4">
                    You may not:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Create an account using false or misleading information</li>
                    <li>Share your account credentials with others</li>
                    <li>Create multiple accounts for the same venue</li>
                    <li>Use another user&apos;s account without permission</li>
                  </ul>
                  <p className="mt-4">
                    We reserve the right to suspend or terminate accounts that violate these terms.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">4. Pricing and Payment</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    <strong>Subscription Plans:</strong> We offer multiple subscription tiers (Basic, Pro, and Premium) with different features and pricing.
                  </p>
                  <p>
                    <strong>Free Trial:</strong> New users receive a 14-day free trial. No credit card is required for the trial period.
                  </p>
                  <p>
                    <strong>Billing:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Subscriptions are billed monthly or annually in advance</li>
                    <li>All fees are non-refundable except as required by law</li>
                    <li>Payment is processed through our secure payment provider (Stripe)</li>
                    <li>You authorize us to charge your payment method for all fees</li>
                    <li>Price increases will be communicated 30 days in advance</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Cancellation:</strong> You may cancel your subscription at any time. Cancellation takes effect at the end of your current billing period. No refunds will be provided for partial months.
                  </p>
                  <p>
                    <strong>Downgrades:</strong> If you downgrade your plan, the downgrade will take effect at the start of your next billing cycle.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">5. Acceptable Use Policy</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    You agree to use our services only for lawful purposes and in accordance with these Terms. You agree NOT to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe upon the rights of others, including intellectual property rights</li>
                    <li>Transmit any harmful code, viruses, or malware</li>
                    <li>Attempt to gain unauthorized access to our systems or networks</li>
                    <li>Interfere with or disrupt the service or servers</li>
                    <li>Use the service to transmit spam or unsolicited communications</li>
                    <li>Scrape, data mine, or otherwise extract data without permission</li>
                    <li>Reverse engineer, decompile, or disassemble any part of the service</li>
                    <li>Use the service in any way that could damage our reputation</li>
                    <li>Resell or redistribute the service without authorization</li>
                  </ul>
                  <p className="mt-4">
                    Violation of this policy may result in immediate suspension or termination of your account.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">6. Intellectual Property Rights</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    <strong>Our Content:</strong> All content, features, and functionality of the service, including but not limited to text, graphics, logos, icons, images, software, and compilation thereof, are the exclusive property of Club Nightlife and are protected by copyright, trademark, and other intellectual property laws.
                  </p>
                  <p>
                    <strong>Your Content:</strong> You retain all rights to the data and content you upload to our service (&quot;Your Content&quot;). By uploading Your Content, you grant us a worldwide, non-exclusive, royalty-free license to use, store, and process Your Content solely for the purpose of providing our services to you.
                  </p>
                  <p>
                    <strong>License to Use:</strong> We grant you a limited, non-exclusive, non-transferable license to access and use our service for your internal business purposes, subject to these Terms.
                  </p>
                  <p>
                    <strong>Trademarks:</strong> &quot;Club Nightlife&quot; and our logo are trademarks of Club Nightlife Inc. You may not use these trademarks without our prior written permission.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">7. Disclaimers and Limitations of Liability</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    <strong>Service &quot;As Is&quot;:</strong> Our service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
                  </p>
                  <p>
                    <strong>No Guarantee:</strong> We do not guarantee that:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>The service will be uninterrupted, timely, secure, or error-free</li>
                    <li>The results obtained from using the service will be accurate or reliable</li>
                    <li>Any errors in the service will be corrected</li>
                    <li>The service will meet your specific requirements</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Limitation of Liability:</strong> To the maximum extent permitted by law, Club Nightlife shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Your use or inability to use the service</li>
                    <li>Unauthorized access to or alteration of your data</li>
                    <li>Any conduct or content of third parties on the service</li>
                    <li>Any content obtained from the service</li>
                  </ul>
                  <p className="mt-4">
                    Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">8. Indemnification</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    You agree to indemnify, defend, and hold harmless Club Nightlife, its officers, directors, employees, agents, and affiliates from and against any claims, liabilities, damages, losses, and expenses, including reasonable legal fees, arising out of or in any way connected with:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Your access to or use of the service</li>
                    <li>Your violation of these Terms</li>
                    <li>Your violation of any third-party rights</li>
                    <li>Your Content uploaded to the service</li>
                    <li>Any activities conducted through your account</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 9 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                <XCircle className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">9. Termination</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    <strong>Termination by You:</strong> You may terminate your account at any time by canceling your subscription through your account settings or by contacting support.
                  </p>
                  <p>
                    <strong>Termination by Us:</strong> We may suspend or terminate your account immediately, without prior notice or liability, for any reason, including but not limited to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Breach of these Terms</li>
                    <li>Non-payment of fees</li>
                    <li>Fraudulent or illegal activity</li>
                    <li>Violation of our Acceptable Use Policy</li>
                    <li>Request by law enforcement or other government agencies</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Effect of Termination:</strong> Upon termination:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Your right to use the service will immediately cease</li>
                    <li>Your account will be deactivated</li>
                    <li>You can export your data within 30 days of termination</li>
                    <li>We will delete your data after 30 days (except as required by law)</li>
                    <li>No refunds will be provided for unused subscription time</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 10 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <Scale className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">10. Dispute Resolution</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    <strong>Governing Law:</strong> These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.
                  </p>
                  <p>
                    <strong>Arbitration:</strong> Any dispute arising from or relating to these Terms or the service shall be resolved through binding arbitration in accordance with the American Arbitration Association&apos;s Commercial Arbitration Rules. The arbitration shall take place in San Francisco, California.
                  </p>
                  <p>
                    <strong>Class Action Waiver:</strong> You agree that any arbitration or proceeding shall be limited to the dispute between us and you individually. You waive your right to participate in a class action lawsuit or class-wide arbitration.
                  </p>
                  <p>
                    <strong>Exceptions:</strong> Either party may seek injunctive relief in any court of competent jurisdiction to protect intellectual property rights.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 11 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">11. General Provisions</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    <strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and Club Nightlife regarding the use of our service.
                  </p>
                  <p>
                    <strong>Changes to Terms:</strong> We reserve the right to modify these Terms at any time. We will notify you of material changes via email or through the service. Your continued use after changes constitutes acceptance of the new Terms.
                  </p>
                  <p>
                    <strong>Severability:</strong> If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force.
                  </p>
                  <p>
                    <strong>Waiver:</strong> No waiver of any term of these Terms shall be deemed a further or continuing waiver of such term or any other term.
                  </p>
                  <p>
                    <strong>Assignment:</strong> You may not assign or transfer these Terms or your account without our prior written consent. We may assign these Terms without restriction.
                  </p>
                  <p>
                    <strong>Force Majeure:</strong> We shall not be liable for any failure to perform our obligations where such failure results from circumstances beyond our reasonable control.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 12 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-pink-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">12. Contact Information</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    If you have any questions about these Terms of Service, please contact us:
                  </p>
                  <div className="bg-dark-900/50 rounded-lg p-4 space-y-2">
                    <p><strong>Email:</strong> legal@clubnightlife.com</p>
                    <p><strong>Mail:</strong> Club Nightlife Inc., Legal Department, 123 Tech Street, San Francisco, CA 94105</p>
                    <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                  </div>
                  <p className="mt-4 text-sm">
                    For general support inquiries, please contact support@clubnightlife.com
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Acknowledgment */}
        <div className="mt-12 glass rounded-2xl p-6 text-center">
          <p className="text-gray-300">
            By using Club Nightlife&apos;s services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
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
