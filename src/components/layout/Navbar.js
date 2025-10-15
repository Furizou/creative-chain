"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show floating navbar when scrolled down more than 100px
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Original Navbar */}
      <nav className="bg-structural text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-primary text-structural px-3 py-1 rounded font-black text-xl">
                CC
              </div>
              <span className="font-heading font-bold text-xl">CreativeChain</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="hover:text-primary transition-colors font-body">
                Home
              </Link>
              <Link href="/branding" className="hover:text-primary transition-colors font-body">
                Branding
              </Link>
              <Link href="/creator" className="hover:text-primary transition-colors font-body">
                For Creators
              </Link>
              <Link href="/marketplace" className="hover:text-primary transition-colors font-body">
                Marketplace
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/login">
                <button className="text-white hover:text-primary transition-colors font-semibold">
                  Login
                </button>
              </Link>
              <Link href="/signup">
                <button className="bg-primary text-structural px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                  Get Started
                </button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Floating Navbar - appears when scrolled */}
      <div
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          isScrolled ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="bg-structural text-white shadow-2xl rounded-full px-6 py-3 flex items-center space-x-6 backdrop-blur-sm bg-opacity-95">
          {/* Compact Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-primary text-structural px-2 py-1 rounded font-black text-sm">
              CC
            </div>
            <span className="font-heading font-bold text-sm hidden sm:inline">CreativeChain</span>
          </Link>

          {/* Compact Navigation */}
          <div className="flex items-center space-x-4 text-sm">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/branding" className="hover:text-primary transition-colors">
              Branding
            </Link>
            <Link href="/creator" className="hover:text-primary transition-colors hidden sm:inline">
              Creators
            </Link>
            <Link href="/marketplace" className="hover:text-primary transition-colors hidden sm:inline">
              Market
            </Link>
          </div>

          {/* Compact CTA */}
          <Link href="/signup">
            <button className="bg-primary text-structural px-4 py-1.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
              Get Started
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
