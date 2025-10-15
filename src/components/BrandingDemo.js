export default function BrandingDemo() {
  return (
    <div className="p-8 space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h1 className="text-4xl font-black text-structural mb-4">
          CreativeChain Branding Demo
        </h1>
        <p className="text-structural mb-4">
          This is a demonstration of our custom branding configuration using Inter font for body text.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-base p-4 rounded-lg border-2 border-structural">
            <h3 className="font-bold mb-2">Base</h3>
            <div className="w-full h-16 bg-base border border-gray-300 rounded"></div>
            <p className="text-sm mt-2">#F8F8F8</p>
          </div>
          
          <div className="bg-primary p-4 rounded-lg text-structural">
            <h3 className="font-bold mb-2">Primary</h3>
            <div className="w-full h-16 bg-primary rounded"></div>
            <p className="text-sm mt-2">#FFCC00</p>
          </div>
          
          <div className="bg-secondary p-4 rounded-lg text-white">
            <h3 className="font-bold mb-2">Secondary</h3>
            <div className="w-full h-16 bg-secondary rounded"></div>
            <p className="text-sm mt-2">#FF6600</p>
          </div>
          
          <div className="bg-structural p-4 rounded-lg text-white">
            <h3 className="font-bold mb-2">Structural</h3>
            <div className="w-full h-16 bg-structural rounded"></div>
            <p className="text-sm mt-2">#333333</p>
          </div>
          
          <div className="bg-warning p-4 rounded-lg text-white">
            <h3 className="font-bold mb-2">Warning</h3>
            <div className="w-full h-16 bg-warning rounded"></div>
            <p className="text-sm mt-2">#CC3333</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-structural">Typography Examples</h2>
          <h3 className="text-xl font-bold text-structural">This is a heading using Outfit font</h3>
          <p className="text-structural">
            This paragraph uses Inter font for body text. It's designed to be highly readable and clean.
          </p>
          
          {/* Debug info */}
          <div className="mt-4 p-4 bg-white border border-gray-200 rounded text-sm">
            <h4 className="font-bold mb-2 text-structural">Tailwind Classes Test:</h4>
            <div className="flex gap-2 mb-4">
              <div className="bg-primary h-8 w-16 rounded flex-shrink-0"></div>
              <div className="bg-secondary h-8 w-16 rounded flex-shrink-0"></div>
              <div className="bg-structural h-8 w-16 rounded flex-shrink-0"></div>
              <div className="bg-warning h-8 w-16 rounded flex-shrink-0"></div>
              <div className="bg-base h-8 w-16 rounded border flex-shrink-0"></div>
            </div>
            <p className="text-structural">Using custom CSS classes from globals.css - No inline styles!</p>
            <p className="text-primary">This should be yellow (primary)</p>
            <p className="text-secondary">This should be orange (secondary)</p>
            <p className="text-warning">This should be red (warning)</p>
          </div>
          
          <div className="flex gap-4">
            <button className="bg-primary text-structural px-4 py-2 rounded font-semibold hover:opacity-80">
              Primary Button
            </button>
            <button className="bg-secondary text-white px-4 py-2 rounded font-semibold hover:opacity-80">
              Secondary Button
            </button>
            <button className="bg-warning text-white px-4 py-2 rounded font-semibold hover:opacity-80">
              Warning Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}