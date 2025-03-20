const {translate:translate2} = require('@vitalets/google-translate-api');

const translate = async (text, to) => {
  try {
    const translated = await translate2(text, to);
    return translated.text;
  } catch (error) {
    console.error('Error translating text:', error);
    
    return text;
  }
};

module.exports = translate;