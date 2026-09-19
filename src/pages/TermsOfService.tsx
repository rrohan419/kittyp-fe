import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const LAST_UPDATED = '3 September 2026';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center text-gray-900 dark:text-white">
              Terms of Service
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">
              Last updated: {LAST_UPDATED}
            </p>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Agreement to terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  These Terms of Service (&quot;Terms&quot;) are a legally binding agreement between you
                  (whether as a pet parent, doctor, clinic administrator, staff member, or other
                  authorised user) and Kittyp (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) concerning your access to
                  and use of the Kittyp website, applications, and related services (collectively,
                  the &quot;Service&quot;).
                </p>
                <p>
                  By accessing or using the Service, you confirm that you have read, understood,
                  and agree to be bound by these Terms and our Privacy Policy. If you do not
                  agree, you must not use the Service.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>The Service</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Kittyp provides software for veterinary clinics and pet care in India, including
                  tools for appointments and visits, consultations, clinical records, invoices and
                  billing support, staff and doctor collaboration, and pet-parent access to
                  relevant health information.
                </p>
                <p>
                  Features may vary by role, clinic configuration, and subscription. We may update,
                  add, or remove features from time to time.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Accounts and eligibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>By using the Service, you represent and warrant that:</p>
                <ol className="list-decimal pl-8 space-y-2">
                  <li>You are at least 18 years of age and have legal capacity to enter into these Terms under the laws of India.</li>
                  <li>Registration and profile information you submit is true, accurate, current, and complete, and you will keep it updated.</li>
                  <li>You will keep login credentials confidential and are responsible for activity under your account.</li>
                  <li>If you act for a clinic or organisation, you are authorised to bind that entity to these Terms.</li>
                  <li>You will use the Service only for lawful purposes and in accordance with these Terms.</li>
                </ol>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Medical and professional disclaimer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Kittyp is a technology platform that helps clinics and professionals organise
                  care workflows. It does not itself provide veterinary diagnosis or treatment.
                  Clinical decisions remain the responsibility of licensed veterinary
                  professionals. Content on the Service (including articles or AI-assisted tools,
                  if any) is for informational or operational support only and is not a substitute
                  for professional veterinary advice.
                </p>
                <p>
                  In an emergency, contact a qualified veterinarian or emergency animal care
                  service immediately.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Acceptable use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>You agree not to:</p>
                <ul className="list-disc pl-8 space-y-2">
                  <li>Access the Service through unauthorised automated means (bots or scrapers) except as we expressly permit</li>
                  <li>Interfere with or disrupt the Service, security, or other users&apos; access</li>
                  <li>Upload unlawful, harmful, misleading, or infringing content</li>
                  <li>Misrepresent your identity, qualifications, or authority to treat animals</li>
                  <li>Use the Service to violate any applicable Indian law or regulation</li>
                  <li>Attempt to reverse engineer, copy, or resell the Service except as allowed by law</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Clinic and user content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  You retain rights in data and content you submit (such as clinic records, notes,
                  and invoices). You grant Kittyp a licence to host, process, transmit, and display
                  that content solely as needed to operate and improve the Service and as directed
                  by your clinic&apos;s authorised users.
                </p>
                <p>
                  Clinics are responsible for the accuracy of clinical and billing information they
                  enter, for obtaining any required consents from pet owners, and for complying with
                  professional and regulatory obligations applicable to veterinary practice in India.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Intellectual property</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  The Service, including software, design, branding, and documentation, is owned by
                  Kittyp or its licensors and is protected by intellectual property laws of India
                  and international treaties. Except for the limited right to use the Service under
                  these Terms, no licence is granted to copy, modify, distribute, or commercially
                  exploit our intellectual property without prior written permission.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Availability and changes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  We aim for reliable availability but do not guarantee uninterrupted or
                  error-free operation. We may suspend or modify the Service for maintenance,
                  security, or operational reasons. We may update these Terms; the &quot;Last updated&quot;
                  date will change when we do. Continued use after changes constitutes acceptance
                  of the revised Terms.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Limitation of liability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  To the maximum extent permitted under applicable Indian law, Kittyp and its
                  directors, employees, and agents shall not be liable for any indirect,
                  incidental, special, consequential, or punitive damages, or for loss of profits,
                  data, goodwill, or business interruption, arising from your use of or inability
                  to use the Service.
                </p>
                <p>
                  Our aggregate liability for claims relating to the Service shall not exceed the
                  fees (if any) you paid us for the Service in the three (3) months preceding the
                  claim, or INR 5,000 if no fees were paid, except where liability cannot be
                  limited by law.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Governing law and disputes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  These Terms are governed by the laws of India. Subject to any mandatory
                  consumer-protection rights, courts in India shall have exclusive jurisdiction
                  over disputes arising out of or relating to these Terms or the Service.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Contact us</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  For questions about these Terms, contact us at{' '}
                  <a href="mailto:contact@kittyp.in" className="text-primary underline">
                    contact@kittyp.in
                  </a>
                  .
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
