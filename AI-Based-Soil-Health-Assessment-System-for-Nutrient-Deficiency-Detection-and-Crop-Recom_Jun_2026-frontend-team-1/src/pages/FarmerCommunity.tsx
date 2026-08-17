import { useEffect, useState } from 'react'
import { Search, Image as ImageIcon, MapPin, Tag, Heart, MessageCircle, Share2, Bookmark, Plus, TrendingUp, Star, MoreHorizontal, Bell, Pin, Info, X } from 'lucide-react'
import { Button, Input, LineSpinner } from '../components/ui'
import { useTranslation, Translate } from '../i18n'
import { getCommunityPosts, createCommunityPost, toggleCommunityPostLike, CommunityPost, updateUserProfile, getCurrentUser, getUserConnections, followUser, unfollowUser } from '../services/api'


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
          followers: 0,
          following: 0,
        }
      }
    } catch {}
    return { name: 'Farmer', avatar: 'F', location: 'India', followers: 0, following: 0 }
  })
  const [connections, setConnections] = useState<{ followers: any[]; following: any[] }>({ followers: [], following: [] })
  const [selectedThread, setSelectedThread] = useState<{
    title: string;
    category: string;
    messages: { author: string; avatar: string; location: string; content: string; time: string; likes: number }[];
  } | null>(null)
  const [connectionsModal, setConnectionsModal] = useState<'followers' | 'following' | null>(null)

  const handleOpenThread = (topic: string, type: 'discussion' | 'category' | 'announcement') => {
    let title = topic
    let category = type === 'category' ? 'Category Advice' : type === 'announcement' ? 'Announcement Update' : 'Recent Discussion'
    let messages: any[] = []

    const topicLower = topic.toLowerCase()
    if (topicLower.includes('urea') || topicLower.includes('fertilizer') || topicLower.includes('fertilizeradvice')) {
      title = 'Which urea brand is best during heavy rainfall?'
      category = 'Fertilizer Advice'
      messages = [
        { author: 'Ramesh Gowda', avatar: 'RG', location: 'Mandya, Karnataka', content: 'Neem-coated Urea is best because it releases nitrogen slowly and prevents leaching during heavy rains.', time: '2 hours ago', likes: 12 },
        { author: 'Srinivas Rao', avatar: 'SR', location: 'Guntur, Andhra Pradesh', content: 'Always check the local weather forecast before broadcasting. Try to apply during a dry spell of 24-48 hours.', time: '1 hour ago', likes: 9 },
        { author: 'Kishan Kumar', avatar: 'KK', location: 'Kadapa, Andhra Pradesh', content: 'Agreed! Split doses also minimize loss. I use IFFCO Neem Urea with great success.', time: '30 mins ago', likes: 4 }
      ]
    } else if (topicLower.includes('ph') || topicLower.includes('soil') || topicLower.includes('sandy') || topicLower.includes('smartfarming')) {
      title = 'Optimal pH for tomato yield in sandy clay?'
      category = 'Soil Health'
      messages = [
        { author: 'Kishan Kumar', avatar: 'KK', location: 'Kadapa, Andhra Pradesh', content: 'Tomatoes grow best in pH 6.0 to 6.8. Sandy clay holds moisture well but keep organic manure content high.', time: '1 day ago', likes: 15 },
        { author: 'Srinivas Rao', avatar: 'SR', location: 'Guntur, Andhra Pradesh', content: 'If pH is above 7.8, apply elemental sulfur or gypsum to buffer it. Avoid high alkaline conditions as it locks nutrients.', time: '18 hours ago', likes: 11 }
      ]
    } else if (topicLower.includes('leaf') || topicLower.includes('maize') || topicLower.includes('disease') || topicLower.includes('pest') || topicLower.includes('pestmanagement')) {
      title = 'Leaf spot pathology advice for maize leaves'
      category = 'Disease Detection'
      messages = [
        { author: 'Rahul Ramayanam', avatar: 'RR', location: 'Anantapur, AP', content: 'This looks like Northern Corn Leaf Blight. Use Mancozeb fungicide spray at 2g/liter of water.', time: '3 hours ago', likes: 8 },
        { author: 'Kishan Kumar', avatar: 'KK', location: 'Kadapa, Andhra Pradesh', content: 'Ensure you clear previous crop residue and rotate crops next season to prevent the spores from surviving.', time: '2 hours ago', likes: 5 }
      ]
    } else if (topicLower.includes('insurance') || topicLower.includes('kharif')) {
      title = '📢 Kharif Crop Insurance Registry Extension'
      category = 'Announcement'
      messages = [
        { author: 'District Nodal Officer', avatar: 'NO', location: 'State Department', content: 'The registration deadline has been extended to August 30, 2026. Register online via PMFBY portal or local banks.', time: '1 day ago', likes: 25 },
        { author: 'Anand Verma', avatar: 'AV', location: 'Nashik, MH', content: 'Are crop cutting experiment reports required for non-loanee farmers?', time: '20 hours ago', likes: 3 },
        { author: 'District Nodal Officer', avatar: 'NO', location: 'State Department', content: 'No, self-declaration forms with land records are sufficient for non-loanee farmers.', time: '18 hours ago', likes: 7 }
      ]
    } else if (topicLower.includes('organic') || topicLower.includes('manure')) {
      title = '📌 Organic Manure Guidelines for Soil Prep'
      category = 'Guide'
      messages = [
        { author: 'Srinivas Rao', avatar: 'SR', location: 'Guntur, Andhra Pradesh', content: 'We suggest incorporating 5-10 tons of decomposed Farm Yard Manure per acre during final plowing.', time: '2 days ago', likes: 18 },
        { author: 'Ramesh Gowda', avatar: 'RG', location: 'Mandya, Karnataka', content: 'Does vermicompost provide the same organic carbon boost?', time: '1 day ago', likes: 4 },
        { author: 'Srinivas Rao', avatar: 'SR', location: 'Guntur, Andhra Pradesh', content: 'Yes, vermicompost is even richer in microbial activity. Apply at 2 tons per acre.', time: '12 hours ago', likes: 9 }
      ]
    } else if (topicLower.includes('weather') || topicLower.includes('weathertopic')) {
      title = '☁️ Weather Forecast & Farm Operations'
      category = 'Weather Advice'
      messages = [
        { author: 'Rahul Ramayanam', avatar: 'RR', location: 'Anantapur, AP', content: 'Heavy rainfall expected this Friday. Postpone any fertilizer or pesticide applications to avoid washout.', time: '5 hours ago', likes: 14 },
        { author: 'Kishan Kumar', avatar: 'KK', location: 'Kadapa, AP', content: 'Thanks for the warning! I will check the drainage channels in the low-lying field sections.', time: '4 hours ago', likes: 8 }
      ]
    } else if (topicLower.includes('success') || topicLower.includes('successstories')) {
      title = '🏆 Crop Yield Milestone Success Story'
      category = 'Success Stories'
      messages = [
        { author: 'Ramesh Gowda', avatar: 'RG', location: 'Mandya, Karnataka', content: 'Using AgroAI CatBoost crop advisory and soil test suggestions, my cotton crop yield increased by 22% this season!', time: '1 day ago', likes: 38 },
        { author: 'Anand Verma', avatar: 'AV', location: 'Nashik, MH', content: 'Outstanding! Did you follow the organic manure guidelines too?', time: '20 hours ago', likes: 12 },
        { author: 'Ramesh Gowda', avatar: 'RG', location: 'Mandya, Karnataka', content: 'Yes, incorporated FYM and maintained NPK split dosage exactly as advised.', time: '18 hours ago', likes: 16 }
      ]
    } else {
      title = `${topic} Messages`
      category = type === 'category' ? 'Category Forum' : 'General'
      messages = [
        { author: 'Rahul Ramayanam', avatar: 'RR', location: 'Anantapur, AP', content: `Welcome to the ${topic} community messages! Ask questions or share tips with other farmers.`, time: 'Just now', likes: 2 },
        { author: 'Kishan Kumar', avatar: 'KK', location: 'Kadapa, Andhra Pradesh', content: `Looking forward to exchanging knowledge about ${topic} here.`, time: 'Just now', likes: 0 }
      ]
    }

    setSelectedThread({ title, category, messages })
  }
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
    return { ...c, members: activeMembers.toString() }
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
            followers: u.followers_count ?? 0,
            following: u.following_count ?? 0,
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
          location: u.region || prev.location,
          followers: u.followers_count ?? 0,
          following: u.following_count ?? 0
        }))
      }
    }).catch(() => {})

    getUserConnections().then(setConnections).catch(() => {})
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
  
  const authorPoints: Record<string, number> = {}
  posts.forEach(p => {
    authorPoints[p.author.name] = (authorPoints[p.author.name] || 0) + (p.likes * 2) + 10
  })
  
  const TOP_CONTRIBUTORS = Object.entries(authorPoints)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, points]) => ({ name, role: 'Community Contributor', points }))

  const PINNED_ANNOUNCEMENTS = [
    { id: 'ann-1', title: '📢 Kharif Crop Insurance Registry', desc: 'Deadline to register Kharif crops is extended to Aug 30. Contact district nodal office.', type: 'alert' },
    { id: 'ann-2', title: '📌 Organic Manure Guidelines', desc: 'Maintain 5:1 nitrogen ratio for wheat soil prepping. Consult fertilizer advisory guides.', type: 'guide' }
  ]

  const RECENT_DISCUSSIONS = posts.slice(0, 3).map((p) => ({
    id: `d-${p.id}`,
    title: p.content.length > 50 ? `${p.content.substring(0, 50)}...` : p.content,
    replies: p.comments || 0,
    category: p.tags[0] || 'General'
  }))

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
                <div key={ann.id} onClick={() => handleOpenThread(ann.title, 'announcement')} className="bg-surface rounded-xl p-3 border border-green-100 shadow-soft space-y-1 cursor-pointer hover:border-green-300 hover:shadow-soft transition-all">
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
                onClick={() => handleOpenThread(c.name, 'category')}
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
                <div onClick={() => setConnectionsModal('followers')} className="cursor-pointer hover:bg-background/80 rounded-lg p-1.5 transition-colors group">
                  <p className="font-bold text-text-primary text-sm group-hover:text-green-600 transition-colors">{userProfile.followers}</p>
                  <p className="text-[10px] text-text-muted uppercase font-semibold">{t('followers') || 'Followers'}</p>
                </div>
                <div onClick={() => setConnectionsModal('following')} className="cursor-pointer hover:bg-background/80 rounded-lg p-1.5 transition-colors group">
                  <p className="font-bold text-text-primary text-sm group-hover:text-green-600 transition-colors">{userProfile.following}</p>
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
                  onClick={() => handleOpenThread(disc.title, 'discussion')}
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
                <div onClick={() => { setConnectionsModal('followers'); setSelectedAuthorProfile(null); }} className="cursor-pointer hover:bg-background/85 rounded-xl p-1 transition-colors group">
                  <p className="font-bold text-text-primary text-lg group-hover:text-green-600 transition-colors">{selectedAuthorProfile.followers}</p>
                  <p className="text-xs text-text-muted uppercase font-semibold">{t('Followers') || 'Followers'}</p>
                </div>
                <div>
                  <p className="font-bold text-text-primary text-lg">{posts.filter(p => p.author.name === selectedAuthorProfile.name).reduce((acc, curr) => acc + curr.likes, 0)}</p>
                  <p className="text-xs text-text-muted uppercase font-semibold">{t('Total Likes') || 'Total Likes'}</p>
                </div>
              </div>

              {selectedAuthorProfile.id && selectedAuthorProfile.name !== userProfile.name && (
                <div className="mt-4 flex justify-center">
                  {connections.following.some(f => f.id === selectedAuthorProfile.id) ? (
                    <Button 
                      variant="outlined" 
                      className="border-red-200 text-red-600 hover:bg-red-50 w-full justify-center"
                      onClick={async () => {
                        try {
                          await unfollowUser(selectedAuthorProfile.id!);
                          const u = await getCurrentUser();
                          if (u) {
                            setUserProfile(prev => ({
                              ...prev,
                              followers: u.followers_count ?? 0,
                              following: u.following_count ?? 0
                            }));
                          }
                          const c = await getUserConnections();
                          setConnections(c);
                          setSelectedAuthorProfile(prev => prev ? { ...prev, followers: Math.max(0, prev.followers - 1) } : null);
                        } catch (err) {
                          console.warn(err);
                        }
                      }}
                    >
                      Unfollow
                    </Button>
                  ) : (
                    <Button 
                      variant="primary" 
                      className="w-full justify-center"
                      onClick={async () => {
                        try {
                          await followUser(selectedAuthorProfile.id!);
                          const u = await getCurrentUser();
                          if (u) {
                            setUserProfile(prev => ({
                              ...prev,
                              followers: u.followers_count ?? 0,
                              following: u.following_count ?? 0
                            }));
                          }
                          const c = await getUserConnections();
                          setConnections(c);
                          setSelectedAuthorProfile(prev => prev ? { ...prev, followers: prev.followers + 1 } : null);
                        } catch (err) {
                          console.warn(err);
                        }
                      }}
                    >
                      Follow
                    </Button>
                  )}
                </div>
              )}

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

      {/* Discussion Thread Modal */}
      {selectedThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedThread(null)}>
          <div className="bg-surface border border-border w-full max-w-lg rounded-2xl shadow-card flex flex-col max-h-[85vh] overflow-hidden animate-scale-up" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-4 border-b border-border bg-background/50 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded uppercase tracking-wider">
                  {selectedThread.category}
                </span>
                <h3 className="text-sm font-bold text-text-primary mt-1.5 leading-snug">{selectedThread.title}</h3>
              </div>
              <button onClick={() => setSelectedThread(null)} className="p-1.5 text-text-muted hover:bg-background rounded-lg transition-colors flex-shrink-0"><X size={18} /></button>
            </div>
            
            {/* Messages Thread List */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1 custom-scrollbar bg-zinc-50/30">
              {selectedThread.messages.map((m, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 text-xs flex-shrink-0 mt-0.5">
                    {m.avatar}
                  </div>
                  <div className="flex-1 bg-surface border border-border/85 rounded-xl p-3 space-y-1 shadow-soft">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-xs text-text-primary">{m.author}</span>
                        <span className="text-[9px] text-text-muted ml-2">{m.location}</span>
                      </div>
                      <span className="text-[9px] text-text-muted">{m.time}</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed font-medium">{m.content}</p>
                    <div className="flex justify-end pt-1">
                      <button className="flex items-center gap-1 text-[10px] text-text-muted hover:text-red-500 transition-colors">
                        <Heart size={11} /> {m.likes}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Post Reply Footer */}
            <div className="p-3 border-t border-border bg-surface flex gap-2 items-center">
              <input 
                placeholder="Write a reply or message..." 
                className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-xs outline-none focus:border-green-500 transition-colors"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const inputVal = (e.target as HTMLInputElement).value
                    if (inputVal.trim()) {
                      const newReply = {
                        author: userProfile.name,
                        avatar: userProfile.avatar,
                        location: userProfile.location,
                        content: inputVal,
                        time: 'Just now',
                        likes: 0
                      }
                      setSelectedThread(prev => prev ? {
                        ...prev,
                        messages: [...prev.messages, newReply]
                      } : null)
                      ;(e.target as HTMLInputElement).value = ''
                    }
                  }
                }}
              />
              <Button variant="primary" size="sm" onClick={(e) => {
                const inputEl = e.currentTarget.previousElementSibling as HTMLInputElement
                const inputVal = inputEl.value
                if (inputVal.trim()) {
                  const newReply = {
                    author: userProfile.name,
                    avatar: userProfile.avatar,
                    location: userProfile.location,
                    content: inputVal,
                    time: 'Just now',
                    likes: 0
                  }
                  setSelectedThread(prev => prev ? {
                    ...prev,
                    messages: [...prev.messages, newReply]
                  } : null)
                  inputEl.value = ''
                }
              }}>Send</Button>
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

      {connectionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setConnectionsModal(null)}>
          <div className="bg-surface border border-border w-full max-w-sm rounded-2xl shadow-card p-5 relative animate-scale-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-md font-bold text-text-primary mb-1 capitalize">
              {connectionsModal === 'followers' ? `${t('followers')} (${userProfile.followers})` : `${t('following')} (${userProfile.following})`}
            </h3>
            <p className="text-xs text-text-muted mb-4">
              {connectionsModal === 'followers' ? 'Farmers and experts who follow your farm updates.' : 'Farmers and consultants you are following.'}
            </p>
            
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar mb-4">
              {connectionsModal === 'followers' ? (
                connections.followers.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-4">No followers yet.</p>
                ) : (
                  connections.followers.map((f, i) => (
                    <div key={f.id} onClick={() => {
                      setSelectedAuthorProfile({
                        id: f.id,
                        name: f.name,
                        avatar: f.avatar,
                        location: f.location,
                        followers: 0
                      });
                      setConnectionsModal(null);
                    }} className="flex items-center justify-between p-2 hover:bg-background rounded-xl transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-50 text-green-700 font-bold flex items-center justify-center text-xs">{f.avatar}</div>
                        <div>
                          <p className="text-xs font-semibold text-text-primary group-hover:text-green-600 transition-colors">{f.name}</p>
                          <p className="text-[10px] text-text-muted">{f.role} • {f.location}</p>
                        </div>
                      </div>
                      <button className="text-[10px] font-bold text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1 rounded-lg border border-green-200">View</button>
                    </div>
                  ))
                )
              ) : (
                connections.following.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-4">Not following anyone yet.</p>
                ) : (
                  connections.following.map((f, i) => (
                    <div key={f.id} onClick={() => {
                      setSelectedAuthorProfile({
                        id: f.id,
                        name: f.name,
                        avatar: f.avatar,
                        location: f.location,
                        followers: 0
                      });
                      setConnectionsModal(null);
                    }} className="flex items-center justify-between p-2 hover:bg-background rounded-xl transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-50 text-green-700 font-bold flex items-center justify-center text-xs">{f.avatar}</div>
                        <div>
                          <p className="text-xs font-semibold text-text-primary group-hover:text-green-600 transition-colors">{f.name}</p>
                          <p className="text-[10px] text-text-muted">{f.role} • {f.location}</p>
                        </div>
                      </div>
                      <button onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await unfollowUser(f.id);
                          const u = await getCurrentUser();
                          if (u) {
                            setUserProfile(prev => ({
                              ...prev,
                              followers: u.followers_count ?? 0,
                              following: u.following_count ?? 0
                            }));
                          }
                          const c = await getUserConnections();
                          setConnections(c);
                        } catch (err) {
                          console.warn(err);
                        }
                        setConnectionsModal(null);
                      }} className="text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200">Unfollow</button>
                    </div>
                  ))
                )
              )}
            </div>
 
            <div className="flex justify-end">
              <Button variant="outlined" size="sm" onClick={() => setConnectionsModal(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
