import { useEffect, useState } from 'react'
import { Search, Image as ImageIcon, MapPin, Tag, Heart, MessageCircle, Share2, Bookmark, Plus, TrendingUp, Star, MoreHorizontal } from 'lucide-react'
import { Button, Input } from '../components/ui'
import { useTranslation } from '../i18n'
import { getCommunityPosts, createCommunityPost, toggleCommunityPostLike, CommunityPost } from '../services/api'


export default function FarmerCommunity({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { t } = useTranslation()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [postText, setPostText] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [isJoined, setIsJoined] = useState(() => {
    try { return localStorage.getItem('community_joined') === 'true' } catch { return false }
  })
  const [selectedAuthorProfile, setSelectedAuthorProfile] = useState<CommunityPost['author'] | null>(null)
  const [userProfile, setUserProfile] = useState<{ name: string; avatar: string; location: string; followers: number; following: number }>(() => {
    // Load real user profile immediately
    try {
      const userStr = localStorage.getItem('user') || localStorage.getItem('user_profile')
      if (userStr && userStr.startsWith('{')) {
        const u = JSON.parse(userStr)
        const displayName = u.username || u.name || t('farmer')
        const loc = u.region || localStorage.getItem('selected_location') || t('india') || 'India'
        return {
          name: displayName,
          avatar: displayName.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase(),
          location: loc,
          followers: u.followers || 0,
          following: u.following || 0,
        }
      }
    } catch {}
    return { name: t('farmer'), avatar: 'F', location: t('india') || 'India', followers: 0, following: 0 }
  })

  const BASE_CATEGORIES = [
    { name: t('wheat'), icon: '🌾' },
    { name: t('maize'), icon: '🌽' },
    { name: t('organicFarming'), icon: '🌱' },
    { name: t('smartFarming'), icon: '🚜' },
    { name: t('irrigationAdvice'), icon: '💧' },
    { name: t('fertilizerAdvice'), icon: '🌿' },
    { name: t('pestManagement'), icon: '🐛' },
    { name: t('weatherTopic'), icon: '☁' },
    { name: t('successStories'), icon: '🏆' },
  ]
  
  const CATEGORIES = BASE_CATEGORIES.map(c => {
    // Count real active members in this category (authors who used this tag)
    const activeMembers = new Set(posts.filter(p => p.tags.some(t => t.toLowerCase() === c.name.toLowerCase() || t.toLowerCase() === c.name.replace(' ', '').toLowerCase())).map(p => p.author.name)).size
    return { ...c, members: activeMembers.toString() }
  })

  useEffect(() => {
    // Attempt to load current user for the profile card
    try {
      const userStr = localStorage.getItem('user') || localStorage.getItem('user_profile')
      if (userStr && userStr.startsWith('{')) {
        const u = JSON.parse(userStr)
        const displayName = u.username || u.name || t('farmer')
        if (displayName) {
          const loc = u.region || localStorage.getItem('selected_location') || t('india') || 'India'
          setUserProfile({
            name: displayName,
            avatar: displayName.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase(),
            location: loc,
            followers: u.followers || 0,
            following: u.following || 0,
          })
        }
      }
    } catch {}

    getCommunityPosts().then(setPosts).catch(() => {})
  }, [])

  const toggleLike = async (id: number) => {
    const post = posts.find(p => p.id === id)
    if (!post) return
    const newLikedState = !post.isLiked
    
    // Optimistic UI update
    setPosts(posts.map(p => p.id === id ? { ...p, isLiked: newLikedState, likes: newLikedState ? p.likes + 1 : p.likes - 1 } : p))
    
    try {
      await toggleCommunityPostLike(id, newLikedState)
    } catch {
      // Revert if failed
      setPosts(posts.map(p => p.id === id ? { ...p, isLiked: post.isLiked, likes: post.likes } : p))
    }
  }

  const toggleSave = (id: number) => {
    setPosts(posts.map(p => p.id === id ? { ...p, isSaved: !p.isSaved } : p))
  }

  const handleImageClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      setPostText(prev => prev + (prev.trim() ? '\n' : '') + t('imageAttached') + ' ')
    }
    input.click()
  }

  const handleTagClick = () => setPostText(prev => prev + (prev.trim() && !prev.endsWith(' ') ? ' ' : '') + '#Crop ')
  const handleLocationClick = () => setPostText(prev => prev + (prev.trim() && !prev.endsWith(' ') ? ' ' : '') + '📍 Location ')


  const handlePost = async () => {
    if (!postText.trim()) return
    setIsPosting(true)
    
    // Extract hashtags as tags
    const tags = postText.match(/#\w+/g)?.map(t => t.substring(1)) || []
    
    try {
      const newPost = await createCommunityPost({
        content: postText,
        tags,
        author: userProfile
      })
      setPosts([newPost, ...posts])
      setPostText('')
    } catch (error) {
      console.error('Failed to post', error)
    } finally {
      setIsPosting(false)
    }
  }

  // Derived dynamic stats
  const TRENDING_TAGS = Array.from(new Set(posts.flatMap(p => p.tags))).slice(0, 5).map(t => `#${t}`)
  
  // Aggregate points by author name
  const authorPoints: Record<string, number> = {}
  posts.forEach(p => {
    authorPoints[p.author.name] = (authorPoints[p.author.name] || 0) + (p.likes * 2) + 10 // 10 points per post, 2 per like
  })
  
  const TOP_CONTRIBUTORS = Object.entries(authorPoints)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, points]) => ({ name, role: t('communityMember'), points }))


  return (
    <div className="p-4 md:p-6 animate-fade-in max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{t('farmerCommunity')}</h2>
          <p className="text-sm text-text-muted">{t('communitySubtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              placeholder={t('searchCommunity')} 
              className="pl-9 pr-4 py-2 rounded-xl border border-border bg-surface text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all w-full md:w-64"
            />
          </div>
          <Button variant={isJoined ? "outlined" : "primary"} icon={isJoined ? undefined : <Plus size={16} />} onClick={() => { const next = !isJoined; setIsJoined(next); try { localStorage.setItem('community_joined', String(next)) } catch {} }}>
            {isJoined ? t('joined') : t('joinGroup')}
          </Button>
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
                  <p className="text-xs text-text-muted">{c.members} {t('members')}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Create Post */}
          <div className="bg-surface rounded-2xl shadow-card border border-border p-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full gradient-primary flex-shrink-0 flex items-center justify-center text-white font-bold">{userProfile.avatar}</div>
              <div className="flex-1">
                <textarea 
                  placeholder={t('createPostPlaceholder')}
                  className="w-full bg-transparent resize-none outline-none text-text-primary text-sm min-h-[60px]"
                  value={postText}
                  onChange={e => setPostText(e.target.value)}
                />
                <div className="flex justify-between items-center mt-3">
                  <div className="flex gap-4">
                    <button onClick={handleImageClick} className="flex items-center gap-1.5 text-text-muted hover:text-green-600 transition-colors text-sm">
                      <ImageIcon size={18} />
                      <span className="hidden sm:inline">{t('image')}</span>
                    </button>
                    <button onClick={handleTagClick} className="flex items-center gap-1.5 text-text-muted hover:text-green-600 transition-colors text-sm">
                      <Tag size={18} />
                      <span className="hidden sm:inline">{t('tagCrop')}</span>
                    </button>
                    <button onClick={handleLocationClick} className="flex items-center gap-1.5 text-text-muted hover:text-green-600 transition-colors text-sm">
                      <MapPin size={18} />
                      <span className="hidden sm:inline">{t('location')}</span>
                    </button>
                  </div>
                  <Button variant="primary" size="sm" onClick={handlePost} disabled={isPosting || !postText.trim()}>
                    {isPosting ? t('posting') : t('postUpdate')}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-10 bg-surface rounded-2xl border border-border">
                <p className="text-text-muted">{t('noPostsYet')}</p>
              </div>
            ) : posts.map(post => (
              <div key={post.id} className="bg-surface rounded-2xl shadow-card border border-border overflow-hidden">
                <div className="p-4 md:p-5">
                  {/* Author Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setSelectedAuthorProfile(post.author)}>
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 text-sm group-hover:bg-green-200 transition-colors">{post.author.avatar}</div>
                      <div>
                        <p className="font-semibold text-text-primary text-sm group-hover:text-green-600 transition-colors">{post.author.name}</p>
                        <p className="text-xs text-text-muted">{post.time} • {post.author.location}</p>
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
                        <Share2 size={16} /> {t('share')}
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
          
          {/* Profile Card */}
            <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
              <div className="h-20 bg-green-600 relative">
                <div className="absolute -bottom-8 left-4 w-16 h-16 rounded-xl bg-background border-4 border-background flex items-center justify-center shadow-sm">
                  <span className="text-xl font-bold text-green-700">{userProfile.avatar}</span>
                </div>
              </div>
              <div className="pt-10 px-4 pb-4">
                <h3 className="font-bold text-text-primary text-lg">{userProfile.name}</h3>
                <p className="text-sm text-text-muted flex items-center gap-1 mt-0.5"><MapPin size={12} /> {userProfile.location}</p>
                
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border text-center">
                  <div>
                    <p className="font-bold text-text-primary text-sm">{posts.filter(p => p.author.name === userProfile.name).length}</p>
                    <p className="text-[10px] text-text-muted uppercase font-semibold">{t('posts')}</p>
                  </div>
                  <div>
                    <p className="font-bold text-text-primary text-sm">{userProfile.followers}</p>
                    <p className="text-[10px] text-text-muted uppercase font-semibold">{t('followers')}</p>
                  </div>
                  <div>
                    <p className="font-bold text-text-primary text-sm">{userProfile.following}</p>
                    <p className="text-[10px] text-text-muted uppercase font-semibold">{t('following')}</p>
                  </div>
                </div>
              </div>
            </div>

          {/* Trending Tags */}
            <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
              <h3 className="font-bold text-text-primary flex items-center gap-2 mb-3"><TrendingUp size={16} className="text-blue-500" /> {t('trendingTopics')}</h3>
              <div className="flex flex-wrap gap-2">
                {TRENDING_TAGS.length === 0 ? (
                  <p className="text-xs text-text-muted">{t('noTrendingTopicsYet')}</p>
                ) : TRENDING_TAGS.map(tag => (
                  <span key={tag} className="px-3 py-1.5 border border-border rounded-lg text-xs text-text-muted hover:border-green-500 hover:text-green-600 transition-colors cursor-pointer bg-background">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

          {/* Top Contributors */}
            <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
              <h3 className="font-bold text-text-primary flex items-center gap-2 mb-4"><Star size={16} className="text-orange-500" /> {t('topContributors')}</h3>
              <div className="space-y-3">
                {TOP_CONTRIBUTORS.length === 0 ? (
                  <p className="text-xs text-text-muted">{t('noContributorsYet')}</p>
                ) : TOP_CONTRIBUTORS.map((contributor, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${i === 0 ? 'bg-orange-100 text-orange-700' : i === 1 ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-700'}`}>
                        {contributor.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary group-hover:text-green-600 transition-colors">{contributor.name}</p>
                        <p className="text-[10px] text-text-muted">{t(contributor.role)}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-green-600">{contributor.points} {t('pt')}</span>
                  </div>
                ))}
              </div>
            </div>
          
        </div>
      </div>

      {/* Profile Modal */}
      {selectedAuthorProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={() => setSelectedAuthorProfile(null)}>
          <div className="bg-surface rounded-2xl w-full max-w-md overflow-hidden shadow-elevated animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="h-24 bg-green-600 relative">
              <div className="absolute -bottom-10 left-6 w-20 h-20 rounded-xl bg-background border-4 border-background flex items-center justify-center shadow-sm">
                <span className="text-3xl font-bold text-green-700">{selectedAuthorProfile.avatar}</span>
              </div>
            </div>
            <div className="pt-12 px-6 pb-6">
              <h3 className="font-bold text-text-primary text-xl">{selectedAuthorProfile.name}</h3>
              <p className="text-sm text-text-muted flex items-center gap-1 mt-1"><MapPin size={14} /> {selectedAuthorProfile.location}</p>
              
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border text-center">
                <div>
                  <p className="font-bold text-text-primary text-lg">{posts.filter(p => p.author.name === selectedAuthorProfile.name).length}</p>
                  <p className="text-xs text-text-muted uppercase font-semibold">{t('Posts')}</p>
                </div>
                <div>
                  <p className="font-bold text-text-primary text-lg">{selectedAuthorProfile.followers}</p>
                  <p className="text-xs text-text-muted uppercase font-semibold">{t('Followers')}</p>
                </div>
                <div>
                  <p className="font-bold text-text-primary text-lg">{posts.filter(p => p.author.name === selectedAuthorProfile.name).reduce((acc, curr) => acc + curr.likes, 0)}</p>
                  <p className="text-xs text-text-muted uppercase font-semibold">{t('Total Likes')}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-bold text-sm text-text-primary mb-3">{t('Recent Posts')}</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                  {posts.filter(p => p.author.name === selectedAuthorProfile.name).length === 0 ? (
                    <p className="text-xs text-text-muted">{t('No posts available.')}</p>
                  ) : posts.filter(p => p.author.name === selectedAuthorProfile.name).map(p => (
                    <div key={p.id} className="p-3 bg-background rounded-lg border border-border text-sm text-text-secondary">
                      {p.content}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
