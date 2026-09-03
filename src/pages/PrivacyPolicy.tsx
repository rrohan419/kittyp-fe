import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const LAST_UPDATED = '3 September 2026';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center text-gray-900 dark:text-white">
              Privacy Policy
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">
              Last updated: {LAST_UPDATED}
            </p>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Who we are</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Kittyp (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates a veterinary clinic CRM and pet
                  health platform for India. Our services help clinics, doctors, staff, and pet
                  parents manage appointments, consultations, visit records, invoices, and related
                  communications through our website and apps (collectively, the &quot;Service&quot;).
                </p>
                <p>
                  This Privacy Policy explains how we collect, use, share, and protect personal
                  data when you use the Service. It is written for users in India and is intended
                  to align with the Digital Personal Data Protection Act, 2023 (&quot;DPDP Act&quot;) and
                  applicable rules. It is not formal legal advice.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Information we collect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h3 className="text-xl font-semibold">Account and profile data</h3>
                <p>
                  When you register or update a profile, we may collect your name, email address,
                  phone number, role (pet parent, doctor, clinic admin, or staff), password or
                  authentication credentials, and organisation or clinic affiliation.
                </p>

                <Separator className="my-4" />

                <h3 className="text-xl font-semibold">Clinic, pet, and owner data</h3>
                <p>
                  Depending on how you use the Service, we may process clinic details, pet profiles
                  (name, species, breed, age, and related identifiers), pet owner contact details,
                  and consent or invite records linking owners to clinics.
                </p>

                <Separator className="my-4" />

                <h3 className="text-xl font-semibold">Visit, health, and care data</h3>
                <p>
                  We may process appointment and visit information, check-in and status history,
                  clinical notes or charts (such as assessment, plan, and follow-up notes),
                  prescriptions or treatment details entered by authorised clinicians, ratings or
                  feedback, and related health-event records.
                </p>

                <Separator className="my-4" />

                <h3 className="text-xl font-semibold">Billing and invoice data</h3>
                <p>
                  When invoices are created or paid through the Service, we may process invoice
                  line items, amounts, payment status or mode, and pet/owner snapshots shown on
                  invoices. Payment processing may involve third-party providers who process
                  payment details under their own terms.
                </p>

                <Separator className="my-4" />

                <h3 className="text-xl font-semibold">Device and usage data</h3>
                <p>
                  We automatically collect technical information such as IP address, browser and
                  device type, operating system, approximate location derived from IP, referring
                  URLs, and how you navigate the Service, to operate, secure, and improve the
                  platform.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>How we use your information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>We use personal data to:</p>
                <ul className="list-disc pl-8 space-y-2">
                  <li>Provide, maintain, and improve the Service</li>
                  <li>Enable clinic operations (scheduling, visits, records, and billing)</li>
                  <li>Authenticate users and manage roles and access</li>
                  <li>Send service emails, invites, notifications, or WhatsApp messages you or your clinic request</li>
                  <li>Detect, prevent, and address security or technical issues</li>
                  <li>Comply with applicable law and enforce our Terms of Service</li>
                  <li>Respond to support requests and grievances</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>How we share information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Care and visit data is shared with the clinics, doctors, and staff who are
                  authorised to treat or administer that pet&apos;s care on the Service. Pet parents
                  may see records made available to them through their account.
                </p>
                <p>
                  We may use processors and service providers (for example hosting, email,
                  messaging, analytics, or payment partners) who process data on our instructions
                  to run the Service. We do not sell personal data.
                </p>
                <p>
                  We may disclose information if required by Indian law, regulation, legal process,
                  or to protect the rights, safety, or security of Kittyp, our users, or others.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Retention and security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  We retain personal data for as long as needed to provide the Service, meet
                  clinic record-keeping needs, resolve disputes, and comply with legal obligations.
                  When data is no longer required, we take steps to delete or anonymise it where
                  reasonably practicable.
                </p>
                <p>
                  We use administrative, technical, and organisational measures designed to protect
                  personal data. No method of transmission or storage is completely secure; please
                  use a strong password and keep your credentials confidential.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Your rights (India — DPDP Act, 2023)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Subject to the DPDP Act and applicable exceptions, as a Data Principal you may
                  have the right to:
                </p>
                <ul className="list-disc pl-8 space-y-2">
                  <li>Access a summary of personal data we process about you and the processing activities</li>
                  <li>Request correction of inaccurate or incomplete personal data</li>
                  <li>Request erasure of personal data when it is no longer necessary or consent is withdrawn (where consent is the basis)</li>
                  <li>Withdraw consent where processing is based on consent</li>
                  <li>Nominate another individual in accordance with applicable rules</li>
                  <li>Raise a grievance with us regarding the processing of your personal data</li>
                </ul>
                <p>
                  To exercise these rights, email{' '}
                  <a href="mailto:contact@kittyp.in" className="text-primary underline">
                    contact@kittyp.in
                  </a>
                  . We may need to verify your identity before responding. Clinics that upload or
                  manage pet and owner data may also act as Data Fiduciaries for certain
                  processing; you can contact the relevant clinic for care-record requests where
                  appropriate.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Children</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  The Service is intended for adults who manage clinics, practise veterinary care,
                  or act as pet parents or guardians. We do not knowingly collect personal data
                  from children for their own accounts without verifiable parental consent as
                  required by law.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Changes to this policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at
                  the top will change when we do. Continued use of the Service after an update
                  means you acknowledge the revised policy.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Contact us</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  For privacy questions or grievances, contact us at{' '}
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

export default PrivacyPolicy;
