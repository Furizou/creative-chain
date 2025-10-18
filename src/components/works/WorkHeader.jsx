"use client";

export default function WorkHeader({ title, creator, category }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-structural">
          {title}
        </h1>
        
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            {creator?.avatar && (
              <img 
                src={creator.avatar} 
                alt={creator.name}
                className="h-12 w-12 rounded-full border-2 border-primary" 
              />
            )}
          </div>
          
          <div className="flex-1">
            <p className="text-lg font-semibold text-structural">
              {creator?.name || 'Anonymous'}
            </p>
            <div className="flex items-center mt-1">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary text-structural">
                {category}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
