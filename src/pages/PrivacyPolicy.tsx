import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center text-gray-900 dark:text-white">Privacy Policy</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Introduction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  At kittyp, we respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
                </p>
                <p>
                  This privacy policy applies to all information collected through our website, as well as any related services, sales, marketing, or events.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h3 className="text-xl font-semibold">Personal Information</h3>
                <p>
                  We may collect personal information that you voluntarily provide to us when you express an interest in obtaining information about us or our products, when you participate in activities on the website, or otherwise when you contact us.
                </p>
                <p>
                  The personal information that we collect depends on the context of your interactions with us and the website, the choices you make, and the products and features you use. The personal information we collect may include:
                </p>
                <ul className="list-disc pl-8 space-y-2">
                  <li>Names</li>
                  <li>Email addresses</li>
                  <li>Mailing addresses</li>
                  <li>Phone numbers</li>
                  <li>Billing information</li>
                </ul>

                <Separator className="my-4" />
                
                <h3 className="text-xl font-semibold">Information Automatically Collected</h3>
                <p>
                  We automatically collect certain information when you visit, use, or navigate the website. This information does not reveal your specific identity but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our website, and other technical information.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>We use personal information collected via our website for a variety of business purposes described below:</p>
                <ul className="list-disc pl-8 space-y-2">
                  <li>To provide and maintain our website</li>
                  <li>To notify you about changes to our website</li>
                  <li>To allow you to participate in interactive features of our website when you choose to do so</li>
                  <li>To provide customer support</li>
                  <li>To gather analysis or valuable information so that we can improve our website</li>
                  <li>To monitor the usage of our website</li>
                  <li>To detect, prevent and address technical issues</li>
                  <li>To fulfill any other purpose for which you provide it</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Your Rights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  If you are a resident in the European Economic Area, you have the right to:
                </p>
                <ul className="list-disc pl-8 space-y-2">
                  <li>Request access to your personal data</li>
                  <li>Request correction of your personal data</li>
                  <li>Request erasure of your personal data</li>
                  <li>Object to processing of your personal data</li>
                  <li>Request restriction of processing your personal data</li>
                  <li>Request transfer of your personal data</li>
                  <li>Withdraw consent</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  If you have any questions about this Privacy Policy, please contact us at privacy@kittyp.com or by mail at: 123 Eco Way, Green City, EC 12345, United States.
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