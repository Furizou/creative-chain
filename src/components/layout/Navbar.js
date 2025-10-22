"use client";


import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";


export default function Navbar() {
 const [showMobileMenu, setShowMobileMenu] = useState(false);
 const [showUserMenu, setShowUserMenu] = useState(false);
 const { user, profile, loading, signOut, isAuthenticated } = useAuth();


 const handleSignOut = async () => {
   await signOut();
   setShowUserMenu(false);
 };


 const AuthButtons = ({ compact = false }) => {
   // Show loading skeleton during loading
   if (loading) {
     return (
       <div className={`${compact ? 'px-4 py-1.5' : 'px-4 py-2'} bg-gray-600 rounded-lg animate-pulse`}>
         <div className="w-16 h-4 bg-gray-500 rounded"></div>
       </div>
     );
   }


   if (isAuthenticated) {
     return (
       <div className="relative">
         <button
           onClick={() => setShowUserMenu(!showUserMenu)}
           className={`flex items-center space-x-3 ${compact ? 'text-sm' : ''} hover:text-primary transition-colors group`}
         >
           <div className="relative">
             <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary text-structural rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
               {profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
             </div>
             {/* Online indicator */}
             <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-structural rounded-full"></div>
           </div>
           <div className="hidden sm:flex flex-col items-start">
             <span className="font-semibold text-sm leading-tight">
               {profile?.username || profile?.full_name || 'User'}
             </span>
             <span className="text-xs text-gray-300 leading-tight">
               Creator
             </span>
           </div>
           <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
           </svg>
         </button>


         {showUserMenu && (
           <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100">
             {/* User Info Header */}
             <div className="px-4 py-3 border-b border-gray-100">
               <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary text-structural rounded-full flex items-center justify-center font-bold">
                   {profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                 </div>
                 <div className="flex-1">
                   <p className="text-sm font-semibold text-gray-900">{profile?.full_name || profile?.username || 'User'}</p>
                   <p className="text-xs text-gray-500">{user?.email}</p>
                 </div>
               </div>
             </div>
            
             {/* Account Section */}
             <div className="py-2">
               <div className="px-4 py-1">
                 <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
               </div>
               <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                 <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                 </svg>
                 Profile Settings
               </Link>
               <Link href="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                 <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                 </svg>
                 Settings
               </Link>
               <Link href="/admin/blockchain" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                 <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                 </svg>
                 Admin Dashboard
               </Link>
             </div>


             {/* Sign Out */}
             <div className="border-t border-gray-100 pt-2">
               <button
                 onClick={handleSignOut}
                 className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
               >
                 <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                 </svg>
                 Sign Out
               </button>
             </div>
           </div>
         )}
       </div>
     );
   }


   return (
     <div className={`flex items-center ${compact ? 'space-x-2' : 'space-x-4'}`}>
       <Link href="/login">
         <button className={`text-white hover:text-primary transition-colors font-semibold ${compact ? 'text-sm' : ''}`}>
           Login
         </button>
       </Link>
       <Link href="/signup">
         <button className={`bg-primary text-structural ${compact ? 'px-4 py-1.5 text-sm' : 'px-4 py-2'} rounded-lg font-semibold hover:opacity-90 transition-opacity`}>
           Get Started
         </button>
       </Link>
     </div>
   );
 };


 return (
   <>
     {/* Sticky Navbar */}
     <nav className="sticky top-0 z-50 bg-structural text-white shadow-lg">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="flex justify-between items-center h-16">
           {/* Logo */}
           <Link href={isAuthenticated ? "/creator" : "/"} className="flex items-center">
             <Image
               src="/logo/logo_white.svg"
               alt="SINAR Logo"
               width={120}
               height={32}
               className="h-8 w-auto"
             />
           </Link>


           {/* Navigation Links */}
           <div className="hidden md:flex items-center space-x-8">
             {!isAuthenticated ? (
               // Guest navigation
               <>
                 <Link href="/" className="hover:text-primary transition-colors font-body">
                   Home
                 </Link>
                 <Link href="/marketplace" className="hover:text-primary transition-colors font-body">
                   Marketplace
                 </Link>
                 <Link href="/verify" className="hover:text-primary transition-colors font-body">
                   Verify
                 </Link>
               </>
             ) : (
               // Logged in user navigation
               <>
                 <Link href="/marketplace" className="hover:text-primary transition-colors font-body">
                   Marketplace
                 </Link>
                 <Link href="/creator/works" className="hover:text-primary transition-colors font-body">
                   My Works
                 </Link>
                 <Link href="/licenses" className="hover:text-primary transition-colors font-body">
                   My Licenses
                 </Link>
                 <Link href="/verify" className="hover:text-primary transition-colors font-body">
                   Verify
                 </Link>
               </>
             )}
           </div>


           {/* Auth Buttons */}
           <div className="hidden md:flex items-center">
             <AuthButtons />
           </div>


           {/* Mobile Menu Button */}
           <button
             className="md:hidden text-white"
             onClick={() => setShowMobileMenu(!showMobileMenu)}
           >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
             </svg>
           </button>
         </div>


         {/* Mobile Menu */}
         {showMobileMenu && (
           <div className="md:hidden bg-structural border-t border-gray-700">
             <div className="px-2 pt-2 pb-3 space-y-1">
               {!isAuthenticated ? (
                 // Guest mobile menu
                 <>
                   <Link href="/" className="block px-3 py-2 text-white hover:text-primary transition-colors">
                     Home
                   </Link>
                   <Link href="/marketplace" className="block px-3 py-2 text-white hover:text-primary transition-colors">
                     Marketplace
                   </Link>
                   <Link href="/verify" className="block px-3 py-2 text-white hover:text-primary transition-colors">
                     Verify
                   </Link>
                   <div className="px-3 py-2 space-y-2 border-t border-gray-700 mt-4 pt-4">
                     <Link href="/login" className="block">
                       <button className="w-full text-white border border-white px-4 py-2 rounded-lg hover:bg-white hover:text-structural transition-colors">
                         Login
                       </button>
                     </Link>
                     <Link href="/signup" className="block">
                       <button className="w-full bg-primary text-structural px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                         Get Started
                       </button>
                     </Link>
                   </div>
                 </>
               ) : (
                 // Logged in mobile menu
                 <>
                   {/* User info */}
                   <div className="px-3 py-3 border-b border-gray-700 mb-2">
                     <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary text-structural rounded-full flex items-center justify-center font-bold">
                         {profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                       </div>
                       <div>
                         <p className="text-white font-semibold text-sm">{profile?.full_name || profile?.username || 'User'}</p>
                         <p className="text-gray-300 text-xs">{user?.email}</p>
                       </div>
                     </div>
                   </div>


                   {/* Navigation */}
                   <Link href="/marketplace" className="block px-3 py-2 text-white hover:text-primary transition-colors">
                     <span className="flex items-center">
                       <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                       </svg>
                       Marketplace
                     </span>
                   </Link>
                   <Link href="/creator/works" className="block px-3 py-2 text-white hover:text-primary transition-colors">
                     <span className="flex items-center">
                       <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                       </svg>
                       My Works
                     </span>
                   </Link>
                   <Link href="/licenses" className="block px-3 py-2 text-white hover:text-primary transition-colors">
                     <span className="flex items-center">
                       <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                       </svg>
                       My Licenses
                     </span>
                   </Link>
                   <Link href="/verify" className="block px-3 py-2 text-white hover:text-primary transition-colors">
                     <span className="flex items-center">
                       <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                       </svg>
                       Verify
                     </span>
                   </Link>
                   <Link href="/profile" className="block px-3 py-2 text-white hover:text-primary transition-colors">
                     <span className="flex items-center">
                       <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                       </svg>
                       Profile
                     </span>
                   </Link>
                   <Link href="/admin/blockchain" className="block px-3 py-2 text-white hover:text-primary transition-colors">
                     <span className="flex items-center">
                       <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                       </svg>
                       Admin Dashboard
                     </span>
                   </Link>
                   <button
                     onClick={handleSignOut}
                     className="block w-full text-left px-3 py-2 text-red-400 hover:text-red-300 transition-colors border-t border-gray-700 mt-4 pt-4"
                   >
                     <span className="flex items-center">
                       <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                       </svg>
                       Sign Out
                     </span>
                   </button>
                 </>
               )}
             </div>
           </div>
         )}
       </div>
     </nav>


     {/* Click outside to close menus */}
     {(showMobileMenu || showUserMenu) && (
       <div
         className="fixed inset-0 z-30"
         onClick={() => {
           setShowMobileMenu(false);
           setShowUserMenu(false);
         }}
       />
     )}
   </>
 );
}



