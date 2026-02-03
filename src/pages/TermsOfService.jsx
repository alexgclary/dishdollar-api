import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, AlertTriangle, Scale, Users, Ban, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TermsOfService() {
  const navigate = useNavigate();
  const lastUpdated = "February 2, 2026";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="text-white hover:bg-white/20 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-10 h-10" />
            <h1 className="text-4xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-green-100">Last updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-12 space-y-8"
        >
          {/* Agreement */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Agreement to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              By accessing or using DishDollar ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you do not have permission to access the Service. These Terms apply to all visitors, users, and others who access or use the Service.
            </p>
          </section>

          {/* Description of Service */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800">Description of Service</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              DishDollar is a meal planning and recipe discovery platform that helps users:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Discover recipes based on dietary preferences and budget</li>
              <li>View real-time grocery prices from participating stores</li>
              <li>Plan meals and track grocery spending</li>
              <li>Generate and manage shopping lists</li>
              <li>Save and organize favorite recipes</li>
            </ul>
          </section>

          {/* User Accounts */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">User Accounts</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
            </p>
            <p className="text-gray-600 leading-relaxed">
              You are responsible for safeguarding the password or authentication method used to access the Service and for any activities or actions under your account. You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
            </p>
          </section>

          {/* Acceptable Use */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800">Acceptable Use</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Use the Service in any way that violates any applicable law or regulation</li>
              <li>Attempt to gain unauthorized access to any portion of the Service</li>
              <li>Use the Service to transmit any malicious code or interfere with the Service</li>
              <li>Scrape, data mine, or use automated systems to access the Service without permission</li>
              <li>Impersonate or attempt to impersonate another user or person</li>
              <li>Use the Service for any commercial purpose without our express written consent</li>
            </ul>
          </section>

          {/* Prohibited Activities */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Ban className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-800">Prohibited Activities</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              The following activities are strictly prohibited:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Reselling or redistributing Service content without authorization</li>
              <li>Creating multiple accounts for abusive purposes</li>
              <li>Circumventing any access restrictions or security measures</li>
              <li>Uploading content that infringes on intellectual property rights</li>
              <li>Harassing, threatening, or intimidating other users</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Intellectual Property</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              The Service and its original content, features, and functionality are and will remain the exclusive property of DishDollar and its licensors. The Service is protected by copyright, trademark, and other laws.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Recipes and content you add to the Service remain your property. By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute that content within the Service.
            </p>
          </section>

          {/* Third-Party Content */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Third-Party Content and Services</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              The Service may contain links to third-party websites, services, or content that are not owned or controlled by DishDollar. This includes:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Grocery store pricing data from Kroger and other retailers</li>
              <li>Recipe content imported from external websites</li>
              <li>Authentication services provided by Google</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services.
            </p>
          </section>

          {/* Disclaimer */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl font-bold text-gray-800">Disclaimer</h2>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>Important:</strong> The Service is provided on an "AS IS" and "AS AVAILABLE" basis. DishDollar makes no warranties, expressed or implied, regarding the Service's operation or the information, content, or materials included therein.
              </p>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              Specifically, we do not warrant that:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Grocery prices displayed are accurate or current (prices may vary by location and time)</li>
              <li>Recipe nutritional information is accurate or complete</li>
              <li>The Service will be uninterrupted, secure, or error-free</li>
              <li>Any dietary or health information provided is suitable for your specific needs</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              Always verify prices at the store before purchasing. Consult a healthcare professional for dietary advice.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              In no event shall DishDollar, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Termination</h2>
            <p className="text-gray-600 leading-relaxed">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease. You may also delete your account at any time through your profile settings.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Changes to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Governing Law</h2>
            <p className="text-gray-600 leading-relaxed">
              These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800">Contact Us</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-green-50 rounded-xl">
              <p className="text-gray-700">
                <strong>Email:</strong> legal@dishdollar.com<br />
                <strong>Website:</strong> dishdollar.com
              </p>
            </div>
          </section>

          {/* Related Links */}
          <section className="pt-6 border-t border-gray-200">
            <p className="text-gray-600">
              See also our{' '}
              <Link to={createPageUrl('PrivacyPolicy')} className="text-green-600 hover:underline">
                Privacy Policy
              </Link>
              {' '}for information about how we collect and use your data.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
