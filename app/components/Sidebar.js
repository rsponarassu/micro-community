export default function Sidebar({ communities, activeId, onSelect }) {
  return (
    <div className="w-64 bg-white min-h-screen p-4 border-r shadow-sm">
      <h2 className="font-bold text-xl mb-6 text-blue-600">Communities</h2>
      <div className="space-y-2">
        {communities.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full text-left p-3 rounded-md transition-colors ${
              activeId === c.id 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="font-medium"># {c.name}</span>
          </button>
        ))}
      </div>
      
      {/* Requirement 2: Button to Create a Community */}
      <button 
        className="mt-8 w-full border-2 border-dashed border-gray-300 p-2 rounded-md text-gray-500 hover:border-blue-400 hover:text-blue-500 text-sm transition"
        onClick={() => alert("Redirect to Create Community Form")}
      >
        + Create Community
      </button>
    </div>
  );
}