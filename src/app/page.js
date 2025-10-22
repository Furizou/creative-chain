"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Shield, 
  Coins, 
  FileText, 
  CheckCircle, 
  Upload, 
  Settings, 
  ShoppingCart, 
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const steps = [
    {
      icon: Upload,
      title: "Upload & Register",
      description: "Securely upload your work. SINAR generates a unique hash and mints an immutable Copyright Certificate NFT on the blockchain."
    },
    {
      icon: Settings,
      title: "Configure Licenses",
      description: "Define license types (personal, commercial, etc.) and set fair prices and royalty splits for collaborators."
    },
    {
      icon: ShoppingCart,
      title: "Sell & Distribute",
      description: "Smart contracts instantly distribute royalties from marketplace sales according to your rules"
    },
    {
      icon: Search,
      title: "Verify On-Chain",
      description: "All transactions (copyrights, licenses, payments) are recorded publicly on the blockchain for complete transparency."
    }
  ];

  const faqs = [
    {
      question: "What blockchain does SINAR use?",
      answer: "SINAR currently operates on the Polygon Amoy testnet for demonstration purposes. We plan to migrate to the Polygon mainnet for full production deployment, ensuring low transaction fees and fast confirmation times."
    },
    {
      question: "Do I need my own crypto wallet?",
      answer: "No, SINAR manages secure custodial wallets for you. When you sign up, we automatically create a secure wallet for your account, so you can focus on creating without worrying about complex wallet management."
    },
    {
      question: "How are royalties split?",
      answer: "Creators define custom royalty percentages for themselves and collaborators. Our smart contracts automatically distribute payments instantly when licenses are purchased, ensuring everyone gets their fair share immediately."
    },
    {
      question: "Is my uploaded file stored on the blockchain?",
      answer: "No, only proof of ownership (hash) is stored on the blockchain. Your actual files are stored securely off-chain, which keeps storage costs low while maintaining verifiable proof of ownership."
    }
  ];

  const nextStep = () => {
    if (isAnimating) return; // Prevent rapid clicking
    setIsAnimating(true);
    
    setTimeout(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 150);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const prevStep = () => {
    if (isAnimating) return; // Prevent rapid clicking
    setIsAnimating(true);
    
    setTimeout(() => {
      setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
    }, 150);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const goToStep = (index) => {
    if (isAnimating || index === currentStep) return;
    setIsAnimating(true);
    
    setTimeout(() => {
      setCurrentStep(index);
    }, 150);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="bg-base text-structural min-h-screen">
      {/* Hero Section - Simplified Two-Column Layout */}
      <section className="py-16 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text */}
            <div>
              <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                Secure Your Creativity, Own Your Rights.
              </h1>
              <p className="text-xl mb-8 text-gray-600">
                Protect your creative works, manage licenses, and receive fair royalties automatically with our innovative platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <button className="bg-primary text-structural px-8 py-4 rounded-lg font-bold text-lg hover:opacity-90 transition-opacity shadow-lg">
                    Get Started
                  </button>
                </Link>
                <Link href="#how-it-works">
                  <button className="bg-white text-structural border-0.5 border-structural px-8 py-4 rounded-lg font-bold text-lg hover:bg-structural hover:text-white transition-colors shadow-lg">
                    Learn More
                  </button>
                </Link>
              </div>
            </div>
            
            {/* Right Column - Hero Mascot */}
            <div className="flex items-center justify-center">
              <Image
                src="/hero_mascot.svg"
                alt="Hero Mascot"
                width={400}
                height={320}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Us Section - Primary Yellow Background with Four Cards */}
      <section className="py-20 bg-primary mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-structural">Why Choose SINAR?</h2>
            <p className="text-xl text-structural max-w-2xl mx-auto">
              Discover the benefits that set us apart in the creative industry
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white/90 p-6 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-primary/20 p-3 rounded-lg inline-block mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-structural">Immutable Copyright</h3>
              <p className="text-structural">
                Register your work on the blockchain for permanent, verifiable proof of ownership that can't be altered or disputed.
              </p>
            </div>
            
            <div className="bg-white/90 p-6 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-secondary/20 p-3 rounded-lg inline-block mb-4">
                <Coins className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-structural">Transparent Royalties</h3>
              <p className="text-structural">
                Automated royalty splits ensure fair and instant payments directly to creators and collaborators.
              </p>
            </div>
            
            <div className="bg-white/90 p-6 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-warning/20 p-3 rounded-lg inline-block mb-4">
                <FileText className="w-8 h-8 text-warning" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-structural">Flexible Licensing</h3>
              <p className="text-structural">
                Easily configure and sell various license types for your creative works with customizable terms.
              </p>
            </div>
            
            <div className="bg-white/90 p-6 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-green-100 p-3 rounded-lg inline-block mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-structural">Secure & Simple</h3>
              <p className="text-structural">
                User-friendly platform with secure custodial wallets managed for you, so you can focus on creating.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Light Background with Polished Slider */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Transparent Process, Powerful Results</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between gap-8">
              {/* Left Navigation Button */}
              <button
                onClick={prevStep}
                className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow flex-shrink-0 hover:bg-gray-50"
                aria-label="Previous step"
              >
                <ChevronLeft className="w-6 h-6 text-structural" />
              </button>
              
              {/* Main Content Card */}
              <div className="flex-1 bg-white rounded-2xl shadow-xl p-12 border border-gray-100 overflow-hidden">
                <div
                  className={`text-center transition-all duration-300 ${
                    isAnimating 
                      ? 'opacity-0 -translate-x-8' 
                      : 'opacity-100 translate-x-0'
                  }`}
                >
                  {/* Current Step Content */}
                  <div className="flex items-center justify-center mb-6">
                    {(() => {
                      const CurrentIcon = steps[currentStep].icon;
                      return <CurrentIcon className="w-16 h-16 text-primary" />;
                    })()}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{steps[currentStep].title}</h3>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    {steps[currentStep].description}
                  </p>
                </div>
              </div>
              
              {/* Right Navigation Button */}
              <button
                onClick={nextStep}
                className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow flex-shrink-0 hover:bg-gray-50"
                aria-label="Next step"
              >
                <ChevronRight className="w-6 h-6 text-structural" />
              </button>
            </div>
            
            {/* Dot Indicators */}
            <div className="flex justify-center mt-8 space-x-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep ? 'bg-primary w-8' : 'bg-gray-300 w-2 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Impact Section - Primary Color Background */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-structural">The Impact</h2>
            <p className="text-xl text-structural max-w-2xl mx-auto">
              See the difference SINAR makes for creators
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-8 shadow-md">
              <h3 className="text-2xl font-bold text-structural mb-6">Before SINAR</h3>
              <ul className="space-y-3 text-structural">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>Complex copyright registration process</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>Opaque royalty systems with delays</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>Payment delays and administrative overhead</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>High risk of piracy and unauthorized use</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>Difficult to prove ownership</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white border-2 border-gray-200 rounded-xl p-8 shadow-md">
              <h3 className="text-2xl font-bold text-structural mb-6">With SINAR</h3>
              <ul className="space-y-3 text-structural">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Simple blockchain registration in minutes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Transparent & automated royalty distribution</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Instant payments via smart contracts</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Verifiable ownership prevents piracy</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Immutable proof of creation and ownership</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Light Background */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Everything you need to know about SINAR</p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-lg">{faq.question}</span>
                  {openFAQ === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {openFAQ === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section - Primary Yellow Background */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-structural mb-6">
            Ready to Secure Your Creativity and Earnings?
          </h2>
          <p className="text-xl text-structural mb-8 max-w-2xl mx-auto">
            Join SINAR today and take control of your creative rights and revenue. Start protecting your work and earning fairly.
          </p>
          <Link href="/signup">
            <button className="bg-structural text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-700 transition-colors shadow-xl">
              Sign Up Now
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
