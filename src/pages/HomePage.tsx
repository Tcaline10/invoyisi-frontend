import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  CreditCard, 
  BarChart3, 
  Zap, 
  Shield, 
  Clock, 
  ArrowRight,
  CheckCircle,
  Star,
  Brain,
  Scan,
  TrendingUp,
  Globe
} from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

const HomePage: React.FC = () => {
  const features = [
    {
      icon: <Brain className="h-8 w-8 text-blue-900" />,
      title: "AI-Powered Invoice Processing",
      description: "Upload invoices and let our AI extract all relevant information automatically, saving you hours of manual data entry."
    },
    {
      icon: <Scan className="h-8 w-8 text-emerald-500" />,
      title: "OCR Technology",
      description: "Convert scanned documents into editable data with high accuracy OCR processing using advanced recognition algorithms."
    },
    {
      icon: <FileText className="h-8 w-8 text-blue-900" />,
      title: "Smart Invoice Management",
      description: "Create, track, and manage invoices with automated workflows, status updates, and professional templates."
    },
    {
      icon: <Users className="h-8 w-8 text-emerald-500" />,
      title: "Client Management",
      description: "Organize client information, track payment history, and maintain detailed records in one centralized location."
    },
    {
      icon: <CreditCard className="h-8 w-8 text-blue-900" />,
      title: "Simplified Payment Management",
      description: "Track payments, record transactions, and get a clear overview of your financial status at a glance."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-emerald-500" />,
      title: "Analytics & Reports",
      description: "Get comprehensive insights into your business performance with detailed analytics and financial reports."
    }
  ];

  const benefits = [
    {
      icon: <Zap className="h-6 w-6 text-blue-900" />,
      title: "Time-Saving Automation",
      description: "Set up recurring invoices, automated reminders, and streamline your entire billing workflow"
    },
    {
      icon: <Shield className="h-6 w-6 text-emerald-500" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with encrypted data storage and row-level security policies"
    },
    {
      icon: <Clock className="h-6 w-6 text-blue-900" />,
      title: "Real-time Updates",
      description: "Get instant notifications and real-time invoice status updates across all your devices"
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-emerald-500" />,
      title: "Scale Your Business",
      description: "Handle growing invoice volumes without additional overhead using cloud-based infrastructure"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Small Business Owner",
      content: "I-Invoyisi has completely transformed how I handle invoicing. The AI processing saves me hours every week and the accuracy is incredible!",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Freelance Consultant",
      content: "The document processing feature is a game-changer. It accurately extracts all invoice data and makes my billing process so much smoother.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Accounting Manager",
      content: "Finally, an invoice management system that truly understands business workflows. The analytics and reporting features are outstanding.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-blue-900 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">I-Invoyisi</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/about" className="text-black hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                About
              </Link>
              <Link to="/signin">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Smart Invoice Management
              <span className="block text-blue-900">Powered by AI</span>
            </h1>
            <p className="text-xl text-black mb-8 max-w-3xl mx-auto">
              I-Invoyisi is a cutting-edge invoice management system designed to streamline your billing process
              and financial operations. By leveraging artificial intelligence and OCR technology, I-Invoyisi
              transforms the way businesses handle invoices, payments, and client management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full">
            <div className="w-full h-full bg-gradient-to-r from-blue-900/10 to-emerald-500/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Businesses
            </h2>
            <p className="text-xl text-black max-w-2xl mx-auto">
              Everything you need to streamline your billing process and financial operations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {feature.icon}
                    <h3 className="text-xl font-semibold text-gray-900 ml-3">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-black">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose I-Invoyisi?
            </h2>
            <p className="text-xl text-black max-w-2xl mx-auto">
              Join businesses worldwide that trust I-Invoyisi for their invoice management and financial operations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-lg shadow-sm mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-black">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-black max-w-2xl mx-auto">
              Don't just take our word for it - hear from businesses that have transformed their workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-black mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-black">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-900 to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Billing Process?
          </h2>
          <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
            Join businesses worldwide using I-Invoyisi to streamline their invoice management and financial operations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto bg-white text-blue-900 hover:bg-gray-100">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                Schedule Demo
              </Button>
            </Link>
          </div>
          <p className="text-white text-sm mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold">I-Invoyisi</span>
              </div>
              <p className="text-white mb-4 max-w-md">
                A cutting-edge invoice management system designed to streamline your billing process
                and financial operations using artificial intelligence and OCR technology.
              </p>
              <div className="flex items-center space-x-2 text-sm text-white">
                <Globe className="h-4 w-4" />
                <span>Trusted by businesses worldwide</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-white">
                <li><Link to="/about" className="hover:text-gray-300 transition-colors">Features</Link></li>
                <li><Link to="/about" className="hover:text-gray-300 transition-colors">Pricing</Link></li>
                <li><Link to="/about" className="hover:text-gray-300 transition-colors">Security</Link></li>
                <li><Link to="/about" className="hover:text-gray-300 transition-colors">Integrations</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-white">
                <li><Link to="/about" className="hover:text-gray-300 transition-colors">Help Center</Link></li>
                <li><Link to="/about" className="hover:text-gray-300 transition-colors">Contact Us</Link></li>
                <li><Link to="/about" className="hover:text-gray-300 transition-colors">API Docs</Link></li>
                <li><Link to="/about" className="hover:text-gray-300 transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white text-sm">
              © 2024 I-Invoyisi. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/about" className="text-white hover:text-gray-300 text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link to="/about" className="text-white hover:text-gray-300 text-sm transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
