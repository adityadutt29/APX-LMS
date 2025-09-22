"use client"
import { useState, useEffect } from "react"
import { PlusCircle, Search, Edit, Trash2, BookOpen, RotateCcw } from "lucide-react"

// Add CSS styles for 3D flip effect
const styles = `
  .perspective-1000 {
    perspective: 1000px;
  }
  .transform-style-preserve-3d {
    transform-style: preserve-3d;
  }
  .backface-hidden {
    backface-visibility: hidden;
  }
  .rotate-y-180 {
    transform: rotateY(180deg);
  }
`

export default function Flashcards() {
  const [flashcards, setFlashcards] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [editingCard, setEditingCard] = useState(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [zoomedCard, setZoomedCard] = useState(null)
  const [isZoomed, setIsZoomed] = useState(false)

  // Fetch flashcards from backend
  useEffect(() => {
    fetchFlashcards()
  }, [])

  const fetchFlashcards = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
  const response = await fetch('http://localhost:5001/api/flashcards', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFlashcards(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching flashcards:', error)
    } finally {
      setLoading(false)
    }
  }

  const [newCard, setNewCard] = useState({
    front: "",
    back: ""
  })

  const filteredCards = flashcards.filter(card => {
    const matchesSearch = card.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.back.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const createCard = async () => {
    if (newCard.front.trim() && newCard.back.trim()) {
      try {
        const token = localStorage.getItem('token')
  const response = await fetch('http://localhost:5001/api/flashcards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(newCard)
        })

        if (response.ok) {
          const data = await response.json()
          setFlashcards([data.data, ...flashcards])
          setNewCard({ front: "", back: "" })
          setIsCreating(false)
        }
      } catch (error) {
        console.error('Error creating flashcard:', error)
      }
    }
  }

  const updateCard = async () => {
    if (editingCard && editingCard.front.trim() && editingCard.back.trim()) {
      try {
        const token = localStorage.getItem('token')
  const response = await fetch(`http://localhost:5001/api/flashcards/${editingCard._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            front: editingCard.front,
            back: editingCard.back
          })
        })

        if (response.ok) {
          const data = await response.json()
          setFlashcards(flashcards.map(card => 
            card._id === editingCard._id ? data.data : card
          ))
          setEditingCard(null)
        }
      } catch (error) {
        console.error('Error updating flashcard:', error)
      }
    }
  }

  const deleteCard = async (id) => {
    try {
      const token = localStorage.getItem('token')
  const response = await fetch(`http://localhost:5001/api/flashcards/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setFlashcards(flashcards.filter(card => card._id !== id))
      }
    } catch (error) {
      console.error('Error deleting flashcard:', error)
    }
  }

  const nextCard = () => {
    if (currentCardIndex < filteredCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setIsFlipped(false)
    }
  }

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
      setIsFlipped(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleCardClick = (card, index) => {
    setZoomedCard(card)
    setCurrentCardIndex(index)
    setIsFlipped(false)
    setIsZoomed(true)
  }

  const closeZoom = () => {
    setIsZoomed(false)
    setTimeout(() => {
      setZoomedCard(null)
    }, 300) // Wait for animation to complete
  }

  // Keyboard navigation for zoomed view
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!zoomedCard) return
      
      switch (e.key) {
        case 'Escape':
          closeZoom()
          break
        case 'ArrowLeft':
          prevCardInZoom()
          break
        case 'ArrowRight':
          nextCardInZoom()
          break
        case ' ':
        case 'Enter':
          e.preventDefault()
          setIsFlipped(!isFlipped)
          break
      }
    }

    if (zoomedCard) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [zoomedCard, currentCardIndex, isFlipped, filteredCards.length])

  const nextCardInZoom = () => {
    if (currentCardIndex < filteredCards.length - 1) {
      const nextIndex = currentCardIndex + 1
      setCurrentCardIndex(nextIndex)
      setZoomedCard(filteredCards[nextIndex])
      setIsFlipped(false)
    }
  }

  const prevCardInZoom = () => {
    if (currentCardIndex > 0) {
      const prevIndex = currentCardIndex - 1
      setCurrentCardIndex(prevIndex)
      setZoomedCard(filteredCards[prevIndex])
      setIsFlipped(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flashcards...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx>{styles}</style>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Flashcards
          </h1>
          <p className="text-gray-600">Quick revision with flashcards ({flashcards.length} cards)</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-400 hover:to-purple-400 transition-all flex items-center gap-2 shadow-lg"
        >
          <PlusCircle className="h-4 w-4" />
          New Card
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search flashcards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:border-blue-400 focus:outline-none shadow-sm"
          />
        </div>
      </div>

      {/* Create/Edit Card Modal */}
      {(isCreating || editingCard) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50 rounded-2xl border border-blue-100 p-8 shadow-2xl backdrop-blur-sm"
            style={{
              boxShadow: '0 25px 50px rgba(59, 130, 246, 0.15), 0 15px 35px rgba(147, 51, 234, 0.1)'
            }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {isCreating ? 'Create New Flashcard' : 'Edit Flashcard'}
              </h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <label className="text-blue-700 text-sm font-semibold uppercase tracking-wide">Question</label>
                </div>
                <textarea
                  placeholder="What do you want to remember? 🤔"
                  value={isCreating ? newCard.front : editingCard?.front || ""}
                  onChange={(e) => isCreating 
                    ? setNewCard({ ...newCard, front: e.target.value })
                    : setEditingCard({ ...editingCard, front: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-3 bg-white/70 border border-blue-200 rounded-xl text-gray-800 placeholder-gray-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 resize-none shadow-sm backdrop-blur-sm transition-all duration-200"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <label className="text-green-700 text-sm font-semibold uppercase tracking-wide">Answer</label>
                </div>
                <textarea
                  placeholder="The answer you need to recall! 💡"
                  value={isCreating ? newCard.back : editingCard?.back || ""}
                  onChange={(e) => isCreating
                    ? setNewCard({ ...newCard, back: e.target.value })
                    : setEditingCard({ ...editingCard, back: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-3 bg-white/70 border border-green-200 rounded-xl text-gray-800 placeholder-gray-500 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/20 resize-none shadow-sm backdrop-blur-sm transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={isCreating ? createCard : updateCard}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-400 hover:to-purple-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
              >
                {isCreating ? '✨ Create Card' : '💫 Update Card'}
              </button>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setEditingCard(null)
                }}
                className="px-6 py-3 bg-white/80 text-gray-700 rounded-xl hover:bg-white transition-all duration-200 border border-gray-200 backdrop-blur-sm font-semibold hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flashcards List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">All Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card, index) => (
            <div
              key={card._id}
              className="group relative bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-2xl p-6 shadow-lg border border-blue-100/50 hover:border-blue-300 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer transform backdrop-blur-sm"
              onClick={() => handleCardClick(card, index)}
              style={{
                backgroundImage: `linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)`,
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1), 0 4px 16px rgba(147, 51, 234, 0.1)'
              }}
            >
              {/* Card number badge */}
              <div className="absolute -top-3 -left-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  #{index + 1}
                </div>
              </div>

              {/* Action buttons */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingCard(card)
                  }}
                  className="p-2 bg-white/80 backdrop-blur-sm text-blue-500 hover:text-blue-600 hover:bg-white rounded-full shadow-md transition-all duration-200 hover:scale-110"
                >
                  <Edit className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteCard(card._id)
                  }}
                  className="p-2 bg-white/80 backdrop-blur-sm text-red-500 hover:text-red-600 hover:bg-white rounded-full shadow-md transition-all duration-200 hover:scale-110"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              {/* Question section */}
              <div className="mb-4 mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
                  <p className="text-blue-700 text-xs font-semibold uppercase tracking-wide">Question</p>
                </div>
                <p className="text-gray-800 text-sm leading-relaxed line-clamp-3 font-medium">
                  {card.front}
                </p>
              </div>

              {/* Answer section */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></div>
                  <p className="text-green-700 text-xs font-semibold uppercase tracking-wide">Answer</p>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                  {card.back}
                </p>
              </div>

              {/* Footer with date and interactive elements */}
              <div className="flex items-center justify-between pt-3 border-t border-gradient-to-r from-blue-100 to-purple-100">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500 font-medium">
                    {formatDate(card.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
                  <div className="w-1 h-1 bg-purple-300 rounded-full"></div>
                  <div className="w-1 h-1 bg-pink-300 rounded-full"></div>
                </div>
              </div>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                backgroundImage: `radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.3) 0%, transparent 50%)`
              }}></div>
            </div>
          ))}
        </div>
      </div>

      {filteredCards.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {flashcards.length === 0 ? 'No flashcards yet' : 'No flashcards found'}
          </h3>
          <p className="text-gray-500 mb-4">
            {flashcards.length === 0 
              ? 'Create your first flashcard for quick revision'
              : 'Try adjusting your search criteria'
            }
          </p>
          {flashcards.length === 0 && (
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-400 hover:to-purple-400 transition-all shadow-lg"
            >
              Create Your First Flashcard
            </button>
          )}
        </div>
      )}

      {/* Zoomed Card Modal */}
      {zoomedCard && (
        <div 
          className={`fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300 ${
            isZoomed ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeZoom}
        >
          <div 
            className={`max-w-2xl w-full transition-all duration-300 transform ${
              isZoomed ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex gap-1">
                    {Array.from({ length: filteredCards.length }, (_, i) => (
                      <div 
                        key={i} 
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          i === currentCardIndex ? 'bg-white' : 'bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    {currentCardIndex + 1} of {filteredCards.length}
                  </span>
                </div>
                <p className="text-lg font-semibold opacity-90">
                  {zoomedCard.front.length > 60 ? zoomedCard.front.substring(0, 60) + '...' : zoomedCard.front}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={prevCardInZoom}
                  disabled={currentCardIndex === 0}
                  className="p-3 bg-white/15 hover:bg-white/25 rounded-xl text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-sm hover:scale-110"
                >
                  ←
                </button>
                <button
                  onClick={nextCardInZoom}
                  disabled={currentCardIndex === filteredCards.length - 1}
                  className="p-3 bg-white/15 hover:bg-white/25 rounded-xl text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-sm hover:scale-110"
                >
                  →
                </button>
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="p-3 bg-white/15 hover:bg-white/25 rounded-xl text-white transition-all duration-200 backdrop-blur-sm hover:scale-110"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={closeZoom}
                  className="p-3 bg-white/15 hover:bg-white/25 rounded-xl text-white transition-all duration-200 backdrop-blur-sm hover:scale-110"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Zoomed Flashcard */}
            <div 
              className="relative h-[28rem] cursor-pointer perspective-1000"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className={`absolute inset-0 w-full h-full transition-transform duration-500 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                {/* Front */}
                <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl p-10 shadow-2xl flex items-center justify-center overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 25px 50px rgba(102, 126, 234, 0.4), 0 15px 35px rgba(118, 75, 162, 0.3)'
                  }}>
                  {/* Decorative elements */}
                  <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-20 -translate-y-20"></div>
                  <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/5 rounded-full translate-x-20 translate-y-20"></div>
                  
                  <div className="text-center relative z-10">
                    <div className="inline-flex items-center gap-3 mb-6">
                      <div className="w-3 h-3 bg-white/80 rounded-full animate-pulse"></div>
                      <h3 className="text-3xl font-bold text-white">Question</h3>
                      <div className="w-3 h-3 bg-white/80 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-xl text-white/90 leading-relaxed font-medium max-w-2xl mx-auto">
                      {zoomedCard.front}
                    </p>
                    <div className="mt-8 flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                      <p className="text-sm text-white/70 font-medium">Click to reveal answer</p>
                      <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                {/* Back */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl p-10 shadow-2xl flex items-center justify-center overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                    boxShadow: '0 25px 50px rgba(17, 153, 142, 0.4), 0 15px 35px rgba(56, 239, 125, 0.3)'
                  }}>
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 -translate-y-16"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -translate-x-24 translate-y-24"></div>
                  
                  <div className="text-center relative z-10">
                    <div className="inline-flex items-center gap-3 mb-6">
                      <div className="w-3 h-3 bg-white/80 rounded-full animate-pulse"></div>
                      <h3 className="text-3xl font-bold text-white">Answer</h3>
                      <div className="w-3 h-3 bg-white/80 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-xl text-white/90 leading-relaxed font-medium max-w-2xl mx-auto">
                      {zoomedCard.back}
                    </p>
                    <div className="mt-8 flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                      <p className="text-sm text-white/70 font-medium">Perfect! 🎉</p>
                      <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Info */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                <span className="text-white/80 text-sm font-medium">
                  Created {formatDate(zoomedCard.createdAt)}
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-white/80 text-sm font-medium">
                  Ready for study
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}