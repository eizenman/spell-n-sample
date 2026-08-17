// Emoji → ElevenLabs v3 audio tag mapping
// Eleven v3 interprets square-bracket tags like [LAUGHS], [WHISPERING], etc.
export const EMOJI_TAG_MAP = {
  '😂': '[LAUGHS]',
  '😆': '[LAUGHS]',
  '🤣': '[LAUGHS]',
  '😢': '[SAD]',
  '😭': '[CRYING]',
  '😐': '[WHISPERING]',
  '😶': '[WHISPERING]',
  '🤐': '[WHISPERING]',
  '😡': '[FRUSTRATED]',
  '😠': '[FRUSTRATED]',
  '🤬': '[FRUSTRATED]',
  '😮': '[GASP]',
  '😲': '[GASP]',
  '😱': '[GASP]',
  '😴': '[TIRED]',
  '🥱': '[YAWN]',
  '🤫': '[NERVOUS]',
  '😰': '[NERVOUS]',
  '😨': '[FEARFUL]',
  '🤩': '[EXCITED]',
  '🥳': '[EXCITED]',
  '😮‍💨': '[SIGH]',
  '😌': '[RELIEVED]',
  '🤤': '[GULPS]',
  '😬': '[NERVOUS]',
  '😓': '[NERVOUS]',
  '🥹': '[CRYING]',
};

// Translate all emojis in text to their ElevenLabs v3 bracket tags
export const translateEmojisToTags = (text) => {
  let result = text;
  for (const [emoji, tag] of Object.entries(EMOJI_TAG_MAP)) {
    result = result.split(emoji).join(` ${tag} `);
  }
  return result.trim();
};

// Check if text contains any mapped emojis
export const getEmojisInText = (text) => {
  return Object.keys(EMOJI_TAG_MAP).filter((emoji) => text.includes(emoji));
};