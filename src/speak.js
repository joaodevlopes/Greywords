export function speak(word, audioUrl) {
  if (audioUrl) {
    new Audio(audioUrl).play().catch(() => tts(word))
    return
  }
  tts(word)
}

function tts(word) {
  if (!('speechSynthesis' in window)) return
  const u = new SpeechSynthesisUtterance(word)
  u.lang = 'en-US'
  u.rate = 0.9
  speechSynthesis.cancel()
  speechSynthesis.speak(u)
}
