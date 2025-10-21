"use client";

import { ChevronDown } from 'lucide-react';

const CategoryFilter = ({ categories = [], selectedCategory = '', onCategoryChange }) => {
  return (
    <div className="relative">
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="appearance-none block w-full px-3 py-2 border border-gray-200 rounded-lg 
                 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                 bg-white text-structural pr-10"
      >
        <option value="">All Categories</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <ChevronDown className="h-5 w-5 text-gray-400" />
      </div>
    </div>
  );
};

export default CategoryFilter;
