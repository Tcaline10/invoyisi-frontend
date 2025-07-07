import React from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { FileText, Github, Linkedin, Mail, Zap, Shield, Clock, DollarSign } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center justify-center w-20 h-20">
            <img src="/logo.svg" alt="Logo" className="w-16 h-16" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">I-Invoyisi</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          A smart invoice management system powered by artificial intelligence
        </p>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">About I-Invoyisi</h2>
            <p className="text-gray-600 leading-relaxed">
              I-Invoyisi is a cutting-edge invoice management system designed to streamline your billing process
              and financial operations. By leveraging artificial intelligence and OCR technology, I-Invoyisi
              transforms the way businesses handle invoices, payments, and client management.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="flex space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-900">
                    <Zap size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI-Powered Invoice Processing</h3>
                  <p className="text-gray-600 mt-2">
                    Upload invoices and let our AI extract all relevant information automatically, saving you hours of manual data entry.
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-700">
                    <DollarSign size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Simplified Payment Management</h3>
                  <p className="text-gray-600 mt-2">
                    Track payments, record transactions, and get a clear overview of your financial status at a glance.
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
                    <Clock size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Time-Saving Automation</h3>
                  <p className="text-gray-600 mt-2">
                    Set up recurring invoices, automated reminders, and streamline your entire billing workflow.
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700">
                    <Shield size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Secure and Reliable</h3>
                  <p className="text-gray-600 mt-2">
                    Your financial data is protected with enterprise-grade security measures and regular backups.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 border-t pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">What I-Invoyisi Can Change</h2>
              <ul className="space-y-4 text-gray-600">
                <li className="flex items-start">
                  <span className="mr-2 text-green-500">✓</span>
                  <span>Reduce manual data entry by up to 90% with AI-powered document scanning</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-500">✓</span>
                  <span>Cut invoice processing time from hours to minutes</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-500">✓</span>
                  <span>Minimize errors and discrepancies in financial records</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-500">✓</span>
                  <span>Improve cash flow with faster invoice processing and payment collection</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-500">✓</span>
                  <span>Enhance client relationships with professional, consistent invoicing</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-500">✓</span>
                  <span>Gain valuable insights into your business finances with comprehensive reporting</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              <img
                src="/images/team/dev.jpeg"
                alt="Developer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900">Developer</h2>
              <h3 className="text-xl font-semibold text-blue-900 mt-1">Mappa Tetong Caline Staelle</h3>
              <p className="text-gray-600 mt-4 max-w-2xl">
                Full-stack developer with expertise in AI integration and financial software solutions.
                Passionate about creating intuitive, efficient tools that solve real business problems.
              </p>

              <div className="flex items-center justify-center md:justify-start mt-6 space-x-4">
                <a
                  href="https://github.com/Tcaline10/Tcaline.git"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-900 transition-colors"
                >
                  <Github size={20} />
                  <span>GitHub</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/caline-tetong-878a8a255?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-900 transition-colors"
                >
                  <Linkedin size={20} />
                  <span>LinkedIn</span>
                </a>
                <a
                  href="mailto:calinetetong@gmail.com"
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-900 transition-colors"
                >
                  <Mail size={20} />
                  <span>Contact</span>
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-gray-500 text-sm mt-8">
        <p>© {new Date().getFullYear()} InvoiceAI. All rights reserved.</p>
      </div>
    </div>
  );
};

export default AboutPage;
