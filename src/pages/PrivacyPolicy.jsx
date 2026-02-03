import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Lock, Eye, Database, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
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
            <Shield className="w-10 h-10" />
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
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
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              DishDollar ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web application and services. Please read this privacy policy carefully. By using DishDollar, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800">Information We Collect</h2>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-3">Personal Information</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              When you create an account or use our services, we may collect:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Name and email address (via Google OAuth)</li>
              <li>Location information (ZIP code for store pricing)</li>
              <li>Dietary preferences and restrictions</li>
              <li>Household size and budget preferences</li>
              <li>Pantry inventory items you choose to share</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-3">Usage Information</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              We automatically collect certain information when you use our app:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Recipes viewed, saved, and added</li>
              <li>Meal planning activity</li>
              <li>Shopping list usage</li>
              <li>Device and browser information</li>
              <li>IP address and general location</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800">How We Use Your Information</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Provide personalized recipe recommendations</li>
              <li>Display accurate grocery prices from local stores</li>
              <li>Track your budget and spending</li>
              <li>Generate shopping lists based on your meal plans</li>
              <li>Improve our services and user experience</li>
              <li>Send important updates about our service (with your consent)</li>
              <li>Respond to your inquiries and support requests</li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800">Third-Party Services</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              DishDollar integrates with the following third-party services:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Google OAuth:</strong> For secure authentication</li>
              <li><strong>Supabase:</strong> For secure data storage and authentication</li>
              <li><strong>Kroger API:</strong> For real-time grocery pricing</li>
              <li><strong>Vercel:</strong> For hosting and analytics</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              Each of these services has their own privacy policies. We encourage you to review them.
            </p>
          </section>

          {/* Data Security */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800">Data Security</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800">Data Retention</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time by contacting us. We will delete your information within 30 days of such request, except where we are required to retain it by law.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Rights</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Access and receive a copy of your personal data</li>
              <li>Rectify or update your personal information</li>
              <li>Request deletion of your personal data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Children's Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              DishDollar is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800">Contact Us</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-green-50 rounded-xl">
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@dishdollar.com<br />
                <strong>Website:</strong> dishdollar.com
              </p>
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
