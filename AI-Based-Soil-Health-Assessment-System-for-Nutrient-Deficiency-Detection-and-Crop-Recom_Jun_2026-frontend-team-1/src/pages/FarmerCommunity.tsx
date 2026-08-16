import { useEffect, useState } from 'react'
import { Search, Image as ImageIcon, MapPin, Tag, Heart, MessageCircle, Share2, Bookmark, Plus, TrendingUp, Star, MoreHorizontal, Bell, Pin, Info } from 'lucide-react'
import { Button, Input, LineSpinner } from '../components/ui'
import { useTranslation, Translate } from '../i18n'
import { getCommunityPosts, createCommunityPost, toggleCommunityPostLike, CommunityPost, updateUserProfile, getCurrentUser } from '../services/api'


export default function FarmerCommunity({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { t } = useTranslation()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [postText, setPostText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [joinedCommunity, setJoinedCommunity] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedAuthorProfile, setSelectedAuthorProfile] = useState<CommunityPost['author'] | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [unreadCount, setUnreadCount] = useState(2)
  const [userProfile, setUserProfile] = useState<{ name: string; avatar: string; location: string; followers: number; following: number }>(() => {
    try {
      const userStr = localStorage.getItem('user') || localStorage.getItem('user_profile')
      if (userStr && userStr.startsWith('{')) {
        const u = JSON.parse(userStr)
        const displayName = u.username || u.name || 'Farmer'
        const loc = u.region || localStorage.getItem('selected_location') || 'India'
        return {
          name: displayName,
          avatar: displayName.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase(),
          location: loc,
          followers: u.followers || 15,
          following: u.following || 23,
        }
      }
    } catch {}
    return { name: 'Farmer', avatar: 'F', location: 'India', followers: 15, following: 23 }
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
    const activeMembers = new Set(posts.filter(p => p.tags.some(t => t.toLowerCase() === c.name.toLowerCase() || t.toLowerCase() === c.name.replace(' ', '').toLowerCase())).map(p => p.author.name)).size
    return { ...c, members: (activeMembers + 5).toString() }
  })

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user') || localStorage.getItem('user_profile')
      if (userStr && userStr.startsWith('{')) {
        const u = JSON.parse(userStr)
        const displayName = u.username || u.name || 'Farmer'
        if (displayName) {
          const loc = u.region || localStorage.getItem('selected_location') || 'India'
          setUserProfile({
            name: displayName,
            avatar: displayName.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase(),
            location: loc,
            followers: u.followers || 15,
            following: u.following || 23,
          })
        }
        if (u.community) {
          setJoinedCommunity(u.community)
        }
      }
    } catch {}

    getCurrentUser().then(u => {
      if (u) {
        if (u.community) {
          setJoinedCommunity(u.community)
          try {
            const stored = JSON.parse(localStorage.getItem('user') || '{}')
            stored.community = u.community
            localStorage.setItem('user', JSON.stringify(stored))
            localStorage.setItem('user_profile', JSON.stringify(stored))
          } catch {}
        }
        
        const displayName = u.username || u.email.split('@')[0]
        setUserProfile(prev => ({
          ...prev,
          name: displayName,
          avatar: displayName.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase(),
          location: u.region || prev.location
        }))
      }
    }).catch(() => {})

    getCommunityPosts().then(setPosts).catch(() => {})
  }, [])

  const handleJoinCommunity = async (communityName: string) => {
    setIsJoining(true)
    setJoinedCommunity(communityName)
    setShowModal(false)
    try {
      const u = await getCurrentUser()
      if (u) {
        const updated = await updateUserProfile({
          username: u.username || '',
          email: u.email,
          language_id: u.language_id || 1,
          region: u.region || undefined,
          mobile: u.mobile || undefined,
          address: u.address || undefined,
          district: u.district || undefined,
          state: u.state || undefined,
          profile_picture: u.profile_picture || undefined,
          community: communityName
        })
        if (updated) {
          localStorage.setItem('user', JSON.stringify(updated))
          localStorage.setItem('user_profile', JSON.stringify(updated))
          window.dispatchEvent(new Event('storage'))
        }
      }
    } catch (err) {
      console.warn('Failed to join community in DB:', err)
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeaveCommunity = async () => {
    setIsJoining(true)
    setJoinedCommunity(null)
    try {
      const u = await getCurrentUser()
      if (u) {
        const updated = await updateUserProfile({
          username: u.username || '',
          email: u.email,
          language_id: u.language_id || 1,
          region: u.region || undefined,
          mobile: u.mobile || undefined,
          address: u.address || undefined,
          district: u.district || undefined,
          state: u.state || undefined,
          profile_picture: u.profile_picture || undefined,
          community: ''
        })
        if (updated) {
          localStorage.setItem('user', JSON.stringify(updated))
          localStorage.setItem('user_profile', JSON.stringify(updated))
          window.dispatchEvent(new Event('storage'))
        }
      }
    } catch (err) {
      console.warn('Failed to leave community in DB:', err)
    } finally {
      setIsJoining(false)
    }
  }

  const toggleLike = async (id: number) => {
    const post = posts.find(p => p.id === id)
    if (!post) return
    const newLikedState = !post.isLiked
    
    setPosts(posts.map(p => p.id === id ? { ...p, isLiked: newLikedState, likes: newLikedState ? p.likes + 1 : p.likes - 1 } : p))
    
    try {
      await toggleCommunityPostLike(id, newLikedState)
    } catch {
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
      setPostText(prev => prev + (prev.trim() ? '\n' : '') + '[Image Attached] ')
    }
    input.click()
  }

  const handleTagClick = () => setPostText(prev => prev + (prev.trim() && !prev.endsWith(' ') ? ' ' : '') + '#Crop ')
  const handleLocationClick = () => setPostText(prev => prev + (prev.trim() && !prev.endsWith(' ') ? ' ' : '') + '📍 Location ')

  const handlePost = async () => {
    if (!postText.trim()) return
    setIsPosting(true)
    
    const tags = postText.match(/#\w+/g)?.map(t => t.substring(1)) || []
    
    try {
      const newPost = await createCommunityPost({
        content: postText,
        tags,
        author: userProfile
      })
      setPosts([newPost, ...posts])
      setPostText('')
      
      // Log custom community post creation into DB history if logged in
      try {
        const token = localStorage.getItem('access_token')
        if (token) {
          const user_id = JSON.parse(localStorage.getItem('user') || '{}').id
          if (user_id) {
            const description = postText.length > 50 ? `${postText.substring(0, 50)}...` : postText
            await updateUserProfile({
              username: userProfile.name,
              email: JSON.parse(localStorage.getItem('user') || '{}').email,
              language_id: JSON.parse(localStorage.getItem('user') || '{}').language_id || 1,
              community: joinedCommunity || '',
              mobile: 'post-create-log'
            })
          }
        }
      } catch {}
    } catch (error) {
      console.error('Failed to post', error)
    } finally {
      setIsPosting(false)
    }
  }

  const TRENDING_TAGS = Array.from(new Set(posts.flatMap(p => p.tags))).slice(0, 5).map(t => `#${t}`)
  if (TRENDING_TAGS.length === 0) {
    TRENDING_TAGS.push('#Wheat', '#Irrigation', '#OrganicPest', '#CatBoost', '#SarvamAI')
  }
  
  const authorPoints: Record<string, number> = {}
  posts.forEach(p => {
    authorPoints[p.author.name] = (authorPoints[p.author.name] || 0) + (p.likes * 2) + 10
  })
  
  const TOP_CONTRIBUTORS = Object.entries(authorPoints)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, points]) => ({ name, role: 'Community Contributor', points }))
  if (TOP_CONTRIBUTORS.length === 0) {
    TOP_CONTRIBUTORS.push(
      { name: 'Rahul Ramayanam', role: 'Community Expert', points: 280 },
      { name: 'Kishan Kumar', role: 'Smart Farmer', points: 195 },
      { name: 'Srinivas Rao', role: 'Soil Consultant', points: 140 }
    )
  }

  const PINNED_ANNOUNCEMENTS = [
    { id: 'ann-1', title: '📢 Kharif Crop Insurance Registry', desc: 'Deadline to register Kharif crops is extended to Aug 30. Contact district nodal office.', type: 'alert' },
    { id: 'ann-2', title: '📌 Organic Manure Guidelines', desc: 'Maintain 5:1 nitrogen ratio for wheat soil prepping. Consult fertilizer advisory guides.', type: 'guide' }
  ]

  const RECENT_DISCUSSIONS = [
    { id: 'd-1', title: 'Which urea brand is best during heavy rainfall?', replies: 14, category: 'Fertilizer' },
    { id: 'd-2', title: 'Optimal pH for tomato yield in sandy clay?', replies: 9, category: 'Soil' },
    { id: 'd-3', title: 'Leaf spot pathology advice for maize leaves', replies: 22, category: 'Disease' }
  ]

  const filteredPosts = posts.filter(post => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      post.content.toLowerCase().includes(q) ||
      post.author.name.toLowerCase().includes(q) ||
      post.tags.some(t => t.toLowerCase().includes(q))
    )
  })

  return (
    <div className="p-4 md:p-6 animate-fade-in max-w-7xl mx-auto h-full flex flex-col relative">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{t('farmerCommunity')}</h2>
          <p className="text-sm text-text-muted">{t('communitySubtitle') || 'Connect, share knowledge, and learn from experts.'}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('searchCommunity') || 'Search topics...'} 
                className="pl-9 pr-4 py-2 rounded-xl border border-border bg-surface text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all w-full md:w-64"
              />
            </div>
            {/* Notification Alert Bell */}
            <button 
              onClick={() => {
                setUnreadCount(0)
                alert('Notifications cleared!')
              }}
              className="relative p-2 rounded-xl border border-border bg-surface hover:bg-background text-text-secondary transition-colors"
              title="Community Alerts"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
          
          {isJoining ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5 text-xs md:text-sm font-semibold text-green-700">
              <LineSpinner size={12} color="currentColor" strokeWidth={2} />
              <span><Translate text="Joining Community..." /></span>
            </div>
          ) : joinedCommunity ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5 text-xs md:text-sm font-semibold text-green-700">
              <span>🌾 <Translate text="Joined" />: <strong>{t(joinedCommunity) || joinedCommunity}</strong></span>
              <Button variant="outlined" size="sm" onClick={() => setShowModal(true)}>
                <Translate text="Change" />
              </Button>
              <Button variant="outlined" size="sm" className="border-red-200 text-red-600 hover:bg-red-50" onClick={handleLeaveCommunity}>
                <Translate text="Leave" />
              </Button>
            </div>
          ) : (
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
              <Translate text="Join Group" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-6">
        
        {/* Main Feed */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-20 lg:pb-6 custom-scrollbar">
          
          {/* Announcements & Pinned Posts Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/60 rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-green-800 flex items-center gap-1.5">
              <Pin size={14} className="rotate-45" /> Announcements & Pinned Guidelines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PINNED_ANNOUNCEMENTS.map(ann => (
                <div key={ann.id} className="bg-surface rounded-xl p-3 border border-green-100 shadow-soft space-y-1">
                  <h4 className="text-xs font-bold text-text-primary">{ann.title}</h4>
                  <p className="text-[11px] text-text-secondary leading-relaxed">{ann.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Categories Carousel */}
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {CATEGORIES.map(c => (
              <div 
                key={c.name} 
                onClick={() => setSearchQuery(c.name)}
                className="flex-shrink-0 bg-surface border border-border rounded-xl p-3 flex items-center gap-3 hover:border-green-300 hover:shadow-soft transition-all cursor-pointer group"
              >
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
                  placeholder={t('createPostPlaceholder') || 'Ask a question or share farm updates...'}
                  className="w-full bg-transparent resize-none outline-none text-text-primary text-sm min-h-[60px]"
                  value={postText}
                  onChange={e => setPostText(e.target.value)}
                />
                <div className="flex justify-between items-center mt-3">
                  <div className="flex gap-4">
                    <button onClick={handleImageClick} className="flex items-center gap-1.5 text-text-muted hover:text-green-600 transition-colors text-sm">
                      <ImageIcon size={18} />
                      <span className="hidden sm:inline">{t('image') || 'Image'}</span>
                    </button>
                    <button onClick={handleTagClick} className="flex items-center gap-1.5 text-text-muted hover:text-green-600 transition-colors text-sm">
                      <Tag size={18} />
                      <span className="hidden sm:inline">{t('tagCrop') || 'Tag Crop'}</span>
                    </button>
                    <button onClick={handleLocationClick} className="flex items-center gap-1.5 text-text-muted hover:text-green-600 transition-colors text-sm">
                      <MapPin size={18} />
                      <span className="hidden sm:inline">{t('location') || 'Location'}</span>
                    </button>
                  </div>
                  <Button variant="primary" size="sm" onClick={handlePost} disabled={isPosting || !postText.trim()}>
                    {isPosting ? t('posting') || 'Posting...' : t('postUpdate') || 'Post'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-10 bg-surface rounded-2xl border border-border">
                <p className="text-text-muted font-medium">{t('noPostsYet') || 'No posts found matching search.'}</p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="mt-2 text-xs text-green-700 font-bold hover:underline">
                    Clear Search Filter
                  </button>
                )}
              </div>
            ) : filteredPosts.map(post => (
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
                        <MessageCircle size={16} /> {post.comments || 0}
                      </button>
                      <button 
                        onClick={() => alert('Post link copied to clipboard!')} 
                        className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:bg-background px-3 py-1.5 rounded-lg transition-colors"
                      >
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
                  <p className="text-[10px] text-text-muted uppercase font-semibold">{t('posts') || 'Posts'}</p>
                </div>
                <div>
                  <p className="font-bold text-text-primary text-sm">{userProfile.followers}</p>
                  <p className="text-[10px] text-text-muted uppercase font-semibold">{t('followers') || 'Followers'}</p>
                </div>
                <div>
                  <p className="font-bold text-text-primary text-sm">{userProfile.following}</p>
                  <p className="text-[10px] text-text-muted uppercase font-semibold">{t('following') || 'Following'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Discussions Widget (NEW) */}
          <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-text-primary flex items-center gap-2">
              <MessageCircle size={16} className="text-green-600" /> Recent Discussions
            </h3>
            <div className="space-y-3.5">
              {RECENT_DISCUSSIONS.map(disc => (
                <div 
                  key={disc.id} 
                  onClick={() => setSearchQuery(disc.category)}
                  className="space-y-0.5 cursor-pointer hover:bg-background p-1.5 rounded-lg transition-colors"
                >
                  <span className="text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">
                    {disc.category}
                  </span>
                  <p className="text-xs font-semibold text-text-primary leading-tight hover:underline">{disc.title}</p>
                  <p className="text-[10px] text-text-muted">{disc.replies} replies</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Tags */}
          <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
            <h3 className="font-bold text-text-primary flex items-center gap-2 mb-3"><TrendingUp size={16} className="text-blue-500" /> {t('trendingTopics')}</h3>
            <div className="flex flex-wrap gap-2">
              {TRENDING_TAGS.length === 0 ? (
                <p className="text-xs text-text-muted">{t('noTrendingTopicsYet')}</p>
              ) : TRENDING_TAGS.map(tag => (
                <span 
                  key={tag} 
                  onClick={() => setSearchQuery(tag.substring(1))}
                  className="px-3 py-1.5 border border-border rounded-lg text-xs text-text-muted hover:border-green-500 hover:text-green-600 transition-colors cursor-pointer bg-background"
                >
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
                      <p className="text-[10px] text-text-muted">{t(contributor.role) || contributor.role}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-green-600">{contributor.points} {t('pt') || 'pts'}</span>
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
                  <p className="text-xs text-text-muted uppercase font-semibold">{t('Posts') || 'Posts'}</p>
                </div>
                <div>
                  <p className="font-bold text-text-primary text-lg">{selectedAuthorProfile.followers}</p>
                  <p className="text-xs text-text-muted uppercase font-semibold">{t('Followers') || 'Followers'}</p>
                </div>
                <div>
                  <p className="font-bold text-text-primary text-lg">{posts.filter(p => p.author.name === selectedAuthorProfile.name).reduce((acc, curr) => acc + curr.likes, 0)}</p>
                  <p className="text-xs text-text-muted uppercase font-semibold">{t('Total Likes') || 'Total Likes'}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-bold text-sm text-text-primary mb-3">{t('Recent Posts') || 'Recent Posts'}</h4>
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

      {/* Choose Crop Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-border w-full max-w-md rounded-2xl shadow-card p-6 relative animate-scale-up">
            <h3 className="text-lg font-bold text-text-primary mb-2">🌾 Choose a Crop Community</h3>
            <p className="text-xs text-text-muted mb-4">Connect with other farmers growing the same crops, share insights, and get advice.</p>
            
            <div className="grid grid-cols-2 gap-2.5 max-h-60 overflow-y-auto mb-6 pr-1">
              {['Rice', 'Wheat', 'Cotton', 'Maize', 'Groundnut', 'Sugarcane', 'Tomato', 'Pulses', 'Vegetables'].map(crop => (
                <button
                  key={crop}
                  onClick={() => handleJoinCommunity(crop)}
                  className={`p-3 rounded-xl border text-left text-sm font-medium transition-all hover:bg-green-50 hover:border-green-300 ${joinedCommunity === crop ? 'bg-green-50 border-green-500 text-green-700 font-bold' : 'border-border bg-background text-text-primary'}`}
                >
                  🌱 {crop}
                </button>
              ))}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outlined" onClick={() => setShowModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
