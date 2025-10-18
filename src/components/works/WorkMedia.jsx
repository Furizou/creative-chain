"use client";

export default function WorkMedia({ type, url, title }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
      <div className="aspect-w-16 aspect-h-9 bg-base rounded-lg overflow-hidden">
        {type === 'image' && (
          <img 
            src={url} 
            alt={title}
            className="w-full h-full object-cover"
          />
        )}
        
        {type === 'video' && (
          <video 
            controls
            className="w-full h-full object-contain"
          >
            <source src={url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
        
        {type === 'audio' && (
          <div className="flex items-center justify-center h-full bg-structural/5">
            <audio 
              controls
              className="w-full max-w-md"
            >
              <source src={url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>
    </div>
  );
}
