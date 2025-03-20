const deepl = require('deepl-node');

// حط هنا الـ API key الخاص بـ DeepL
const translator = new deepl.Translator('baf6c849-a790-45d5-8303-136572cad857:fx');

const translate = async (text, to) => {
  try {
    const result = await translator.translateText(text, null, to.to.toUpperCase());
    return result.text;
  } catch (error) {
    console.error('Error translating text with DeepL:', error);
    return text;
  }
};

module.exports = translate;

// const {translate:translate2} = require('@vitalets/google-translate-api');

// const translate = async (text, to) => {
//   try {
//     const translated = await translate2(text, to);
//     return translated.text;
//   } catch (error) {
//     console.error('Error translating text:', error);
    
//     return text;
//   }
// };

// module.exports = translate;

// const axios = require('axios');

// const translate = async (text, to = 'en') => {
//   try {
//     const response = await axios.post('https://libretranslate.de/translate', {
//       q: text,
//       source: 'auto',
//       target: to,
//       format: 'text'
//     });
//     return response.data.translatedText;
//   } catch (error) {
//     console.error('LibreTranslate error:', error);
//     return text;
//   }
// };

// module.exports = translate;
