"use client";

import { useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ onSearch, placeholder = "Search creative works..." }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Debounce search with 300ms delay
    const timeoutId = setTimeout(() => {
      onSearch(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearch}
        className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg 
                 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                 bg-white text-structural placeholder-gray-400"
        placeholder={placeholder}
      />
    </div>
  );
}