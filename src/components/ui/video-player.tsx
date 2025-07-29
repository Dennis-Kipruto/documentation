'use client'

import { useRef, useState, useEffect } from 'react'
import { PlayIcon, PauseIcon, VolumeXIcon, Volume2Icon, MaximizeIcon, MinimizeIcon } from 'lucide-react'

interface VideoPlayerProps {
  src: string
  title?: string
  className?: string
}

export function VideoPlayer({ src, title, className = '' }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => setDuration(video.duration)
    const handleVolumeChange = () => setVolume(video.volume)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('volumechange', handleVolumeChange)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('volumechange', handleVolumeChange)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (video) {
      const newTime = (parseFloat(e.target.value) / 100) * duration
      video.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (video) {
      const newVolume = parseFloat(e.target.value) / 100
      video.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div 
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full"
        onClick={togglePlay}
        title={title}
      />
      
      {/* Controls overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/50 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Play/Pause button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-4 transition-colors"
          >
            {isPlaying ? (
              <PauseIcon className="w-8 h-8" />
            ) : (
              <PlayIcon className="w-8 h-8" />
            )}
          </button>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Progress bar */}
          <div className="mb-2">
            <input
              type="range"
              min="0"
              max="100"
              value={duration ? (currentTime / duration) * 100 : 0}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={togglePlay}
                className="text-white hover:text-slate-300 transition-colors"
              >
                {isPlaying ? (
                  <PauseIcon className="w-5 h-5" />
                ) : (
                  <PlayIcon className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={toggleMute}
                className="text-white hover:text-slate-300 transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeXIcon className="w-5 h-5" />
                ) : (
                  <Volume2Icon className="w-5 h-5" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />

              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-slate-300 transition-colors"
            >
              {isFullscreen ? (
                <MinimizeIcon className="w-5 h-5" />
              ) : (
                <MaximizeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}