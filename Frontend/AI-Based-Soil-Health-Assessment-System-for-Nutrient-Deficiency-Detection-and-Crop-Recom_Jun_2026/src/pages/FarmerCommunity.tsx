import { useState } from 'react'
import { Search, Image as ImageIcon, MapPin, Tag, Heart, MessageCircle, Share2, Bookmark, Plus, TrendingUp, Users, Star, MoreHorizontal } from 'lucide-react'
import { Button, Input } from '../components/ui'

const CATEGORIES = [
  { name: 'Wheat Farmers', icon: '🌾', members: '12K' },
  { name: 'Maize Farmers', icon: '🌽', members: '8K' },
  { name: 'Organic Farming', icon: '🌱', members: '25K' },
  { name: 'Smart Farming', icon: '🚜', members: '15K' },
  { name: 'Irrigation', icon: '💧', members: '10K' },
  { name: 'Fertilizers', icon: '🌿', members: '18K' },
  { name: 'Pest Management', icon: '🐛', members: '14K' },
  { name: 'Weather Discussion', icon: '☁', members: '20K' },
  { name: 'Success Stories', icon: '🏆', members: '5K' },
  { name: 'Government Schemes', icon: '🇮🇳', members: '30K' },
]

const POSTS = [
  {
    id: 1,
    author: { name: 'Rajesh Kumar', avatar: 'RK', location: 'Punjab, India', followers: 1200 },
    time: '2 hours ago',
    content: 'Just successfully harvested my wheat crop using the AgroAI recommendation! The new organic fertilizer schedule increased my yield by 20% this season. Highly recommend everyone to follow the soil test insights closely.',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80',
    tags: ['Wheat', 'Success Story', 'Organic'],
    likes: 342,
    comments: 45,
    isLiked: false,
    isSaved: false,
  },
  {
    id: 2,
    author: { name: 'Sarah Okonkwo', avatar: 'SO', location: 'Lagos, Nigeria', followers: 850 },
    time: '5 hours ago',
    content: 'Noticing some yellow spots on my maize leaves. I ran it through the AgroAI Disease Detection tool and it looks like Maize Rust. Anyone else dealing with this right now? The app suggested a copper-based fungicide.',
    tags: ['Maize', 'Pest Management', 'Disease'],
    likes: 128,
    comments: 32,
    isLiked: true,
    isSaved: false,
  },
  {
    id: 3,
    author: { name: 'Ali Hassan', avatar: 'AH', location: 'Sindh, Pakistan', followers: 2340 },
    time: '1 day ago',
    content: 'The government just announced a new subsidy for drip irrigation systems. Make sure to check the \'Government Schemes\' tab in the chatbot to see if you are eligible!',
    tags: ['Irrigation', 'Government Schemes', 'Smart Farming'],
    likes: 890,
    comments: 112,
    isLiked: false,
    isSaved: true,
  },
]

const TRENDING_TAGS = ['#KharifSeason', '#MonsoonReady', '#OrganicYield', '#SoilHealth', '#SmartTractor']
const TOP_CONTRIBUTORS = [
  { name: 'Amit Singh', role: 'Expert Agronomist', points: 4500 },
  { name: 'Priya Sharma', role: 'Organic Farmer', points: 3800 },
  { name: 'Mohammed Ali', role: 'Tech Enthusiast', points: 3200 },
]

export default function FarmerCommunity({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [posts, setPosts] = useState(POSTS)
  const [postText, setPostText] = useState('')

  const toggleLike = (id: number) => {
    setPosts(posts.map(p => p.id === id ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p))
  }

  const toggleSave = (id: number) => {
    setPosts(posts.map(p => p.id === id ? { ...p, isSaved: !p.isSaved } : p))
  }

  return (
    <div className="p-4 md:p-6 animate-fade-in max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Farmer Community</h2>
          <p className="text-sm text-text-muted">Connect, share, and learn with farmers worldwide</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              placeholder="Search community..." 
              className="pl-9 pr-4 py-2 rounded-xl border border-border bg-surface text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all w-full md:w-64"
            />
          </div>
          <Button variant="primary" icon={<Plus size={16} />}>Join Group</Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-6">
        
        {/* Main Feed */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-20 lg:pb-6 custom-scrollbar">
          
          {/* Categories Carousel */}
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {CATEGORIES.map(c => (
              <div key={c.name} className="flex-shrink-0 bg-surface border border-border rounded-xl p-3 flex items-center gap-3 hover:border-green-300 hover:shadow-soft transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-xl group-hover:scale-110 transition-transform">{c.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-text-primary whitespace-nowrap">{c.name}</p>
                  <p className="text-xs text-text-muted">{c.members} members</p>
                </div>
              </div>
            ))}
          </div>

          {/* Create Post */}
          <div className="bg-surface rounded-2xl shadow-card border border-border p-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full gradient-primary flex-shrink-0 flex items-center justify-center text-white font-bold">RF</div>
              <div className="flex-1 space-y-3">
                <textarea 
                  placeholder="Share your farming journey, ask a question, or post an update..."
                  className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:border-green-500 outline-none resize-none min-h-[80px]"
                  value={postText}
                  onChange={e => setPostText(e.target.value)}
                />
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-green-600 hover:bg-green-50 px-2.5 py-1.5 rounded-lg transition-colors">
                      <ImageIcon size={16} /> Image
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-green-600 hover:bg-green-50 px-2.5 py-1.5 rounded-lg transition-colors">
                      <Tag size={16} /> Tag Crop
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-green-600 hover:bg-green-50 px-2.5 py-1.5 rounded-lg transition-colors hidden sm:flex">
                      <MapPin size={16} /> Location
                    </button>
                  </div>
                  <Button variant="primary" size="sm" disabled={!postText.trim()}>Post Update</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-6">
            {posts.map(post => (
              <div key={post.id} className="bg-surface rounded-2xl shadow-card border border-border overflow-hidden">
                <div className="p-4 md:p-5">
                  {/* Author Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">{post.author.avatar}</div>
                      <div>
                        <p className="font-bold text-text-primary text-sm flex items-center gap-1">
                          {post.author.name}
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded ml-1">Pro</span>
                        </p>
                        <p className="text-xs text-text-muted flex items-center gap-1">
                          <MapPin size={10} /> {post.author.location} • {post.time}
                        </p>
                      </div>
                    </div>
                    <button className="text-text-muted hover:text-text-primary p-1"><MoreHorizontal size={18} /></button>
                  </div>
                  
                  {/* Content */}
                  <p className="text-sm text-text-primary leading-relaxed mb-4">{post.content}</p>
                  
                  {/* Optional Image */}
                  {post.image && (
                    <div className="rounded-xl overflow-hidden mb-4 border border-border">
                      <img src={post.image} alt="Post attachment" className="w-full h-auto max-h-80 object-cover" />
                    </div>
                  )}
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">#{tag}</span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-1 sm:gap-4">
                      <button onClick={() => toggleLike(post.id)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${post.isLiked ? 'text-red-500 bg-red-50' : 'text-text-secondary hover:bg-background'}`}>
                        <Heart size={16} className={post.isLiked ? 'fill-current' : ''} /> {post.likes}
                      </button>
                      <button className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:bg-background px-3 py-1.5 rounded-lg transition-colors">
                        <MessageCircle size={16} /> {post.comments}
                      </button>
                      <button className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:bg-background px-3 py-1.5 rounded-lg transition-colors">
                        <Share2 size={16} /> Share
                      </button>
                    </div>
                    <button onClick={() => toggleSave(post.id)} className={`p-2 rounded-lg transition-colors ${post.isSaved ? 'text-yellow-500 bg-yellow-50' : 'text-text-secondary hover:bg-background'}`}>
                      <Bookmark size={18} className={post.isSaved ? 'fill-current' : ''} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-6 overflow-y-auto pb-20 lg:pb-6 custom-scrollbar hidden lg:block">
          
          {/* Profile Preview */}
          <div className="bg-surface rounded-2xl shadow-card border border-border overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-green-500 to-emerald-600"></div>
            <div className="px-5 pb-5 relative">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white text-xl font-bold border-4 border-surface absolute -top-8 left-5 shadow-sm">RF</div>
              <div className="pt-10">
                <h3 className="font-bold text-text-primary text-lg">Rajesh Farmer</h3>
                <p className="text-xs text-text-muted mb-4 flex items-center gap-1"><MapPin size={12}/> Punjab, India</p>
                <div className="grid grid-cols-3 gap-2 text-center pt-4 border-t border-border">
                  <div><p className="font-bold text-text-primary">12</p><p className="text-[10px] text-text-muted uppercase tracking-wider">Posts</p></div>
                  <div><p className="font-bold text-text-primary">850</p><p className="text-[10px] text-text-muted uppercase tracking-wider">Followers</p></div>
                  <div><p className="font-bold text-text-primary">245</p><p className="text-[10px] text-text-muted uppercase tracking-wider">Following</p></div>
                </div>
              </div>
            </div>
          </div>

          {/* Trending Tags */}
          <div className="bg-surface rounded-2xl shadow-card border border-border p-5">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-blue-500"/> Trending Topics</h3>
            <div className="flex flex-wrap gap-2">
              {TRENDING_TAGS.map(tag => (
                <span key={tag} className="text-xs font-medium text-text-secondary bg-background px-3 py-1.5 rounded-lg border border-border hover:border-blue-300 hover:text-blue-600 cursor-pointer transition-colors">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Top Contributors */}
          <div className="bg-surface rounded-2xl shadow-card border border-border p-5">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2"><Star size={16} className="text-yellow-500"/> Top Contributors</h3>
            <div className="space-y-4">
              {TOP_CONTRIBUTORS.map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">{c.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{c.name}</p>
                      <p className="text-[10px] text-text-muted">{c.role}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">{c.points} pt</span>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
