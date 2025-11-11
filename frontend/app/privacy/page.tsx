'use client'

import Link from 'next/link'
import { ArrowLeft, Shield, Eye, Lock, Database, Users, Globe } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">Privacy Policy</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Your privacy is important to us. This policy explains how Club Nightlife collects, uses, and protects your personal information.
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
                <Database className="h-5 w-5 text-primary-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">1. Information We Collect</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    We collect information that you provide directly to us, including:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Account Information:</strong> Name, email address, phone number, club name, and business details when you register for our services.</li>
                    <li><strong>Payment Information:</strong> Credit card details and billing information processed securely through our payment processor (Stripe).</li>
                    <li><strong>Member Data:</strong> Information about club members that you add to your account, including names, contact details, and attendance records.</li>
                    <li><strong>Usage Data:</strong> Information about how you use our platform, including QR code scans, feature usage, and system interactions.</li>
                    <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Eye className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">2. How We Use Your Information</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    We use the information we collect to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Provide, maintain, and improve our services</li>
                    <li>Process transactions and send related information</li>
                    <li>Send technical notices, updates, security alerts, and support messages</li>
                    <li>Respond to your comments, questions, and customer service requests</li>
                    <li>Monitor and analyze trends, usage, and activities in connection with our services</li>
                    <li>Detect, prevent, and address technical issues and fraudulent activity</li>
                    <li>Personalize and improve your experience</li>
                    <li>Send marketing communications (with your consent)</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-pink-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">3. Information Sharing and Disclosure</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    We do not sell or rent your personal information to third parties. We may share your information in the following circumstances:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Service Providers:</strong> We work with third-party service providers who perform services on our behalf, such as payment processing, data analysis, email delivery, and hosting services.</li>
                    <li><strong>Legal Requirements:</strong> We may disclose your information if required by law or in response to valid requests by public authorities.</li>
                    <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
                    <li><strong>With Your Consent:</strong> We may share your information with your explicit consent.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Lock className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">4. Data Security</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    We take the security of your data seriously and implement appropriate technical and organizational measures to protect your information:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>All data transmission is encrypted using SSL/TLS protocols</li>
                    <li>Data at rest is encrypted using industry-standard encryption (AES-256)</li>
                    <li>Regular security audits and vulnerability assessments</li>
                    <li>Access controls and authentication mechanisms</li>
                    <li>Employee training on data security and privacy practices</li>
                    <li>Regular backups and disaster recovery procedures</li>
                  </ul>
                  <p className="mt-4">
                    However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee its absolute security.
                  </p>
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
                <h2 className="text-2xl font-bold text-white mb-3">5. Your Rights and Choices</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    You have certain rights regarding your personal information:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Access and Update:</strong> You can access and update your account information at any time through your account settings.</li>
                    <li><strong>Data Portability:</strong> You can request a copy of your data in a machine-readable format.</li>
                    <li><strong>Deletion:</strong> You can request deletion of your account and associated data. We will retain some information as required by law.</li>
                    <li><strong>Marketing Communications:</strong> You can opt out of marketing emails by clicking the unsubscribe link in any email.</li>
                    <li><strong>Cookies:</strong> You can control cookies through your browser settings. See our Cookie Policy for more details.</li>
                  </ul>
                  <p className="mt-4">
                    To exercise these rights, please contact us at privacy@clubnightlife.com
                  </p>
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
                <h2 className="text-2xl font-bold text-white mb-3">6. International Data Transfers</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws than your country.
                  </p>
                  <p>
                    We ensure that such transfers comply with applicable data protection laws and that appropriate safeguards are in place to protect your information, including:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Standard contractual clauses approved by the European Commission</li>
                    <li>Privacy Shield certification (where applicable)</li>
                    <li>Other legally recognized transfer mechanisms</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">7. Children&apos;s Privacy</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that we have collected personal information from a child under 18, we will take steps to delete such information.
                  </p>
                  <p>
                    If you believe we might have information from or about a child under 18, please contact us at privacy@clubnightlife.com
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">8. Data Retention</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy. We will also retain and use your information to comply with legal obligations, resolve disputes, and enforce our agreements.
                  </p>
                  <p>
                    When you close your account, we will retain your data for 30 days in case you wish to reactivate. After this period, your data will be permanently deleted, except for information we are required to retain by law.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 9 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                <Globe className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">9. Changes to This Policy</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date.
                  </p>
                  <p>
                    We encourage you to review this Privacy Policy periodically for any changes. Your continued use of our services after any modifications indicates your acceptance of the updated Privacy Policy.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 10 */}
          <section className="glass rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">10. Contact Us</h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    If you have any questions about this Privacy Policy or our privacy practices, please contact us:
                  </p>
                  <div className="bg-dark-900/50 rounded-lg p-4 space-y-2">
                    <p><strong>Email:</strong> privacy@clubnightlife.com</p>
                    <p><strong>Mail:</strong> Club Nightlife Privacy Team, 123 Tech Street, San Francisco, CA 94105</p>
                    <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                  </div>
                  <p className="mt-4">
                    For GDPR-related inquiries, please contact our Data Protection Officer at dpo@clubnightlife.com
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Back to Top */}
        <div className="mt-12 text-center">
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
