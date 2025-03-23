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
// const translate = require('translate-google');

// module.exports = translate;

// const { default: translate2 } = require('google-translate-open-api');

// async function translate(text, to) {
//   try {
//     const result = await translate2(text, { tld: "com", to });
//     return result.data[0];
//   } catch (err) {
//     console.error(err);
//     return text;
//   }
// }

// const vitaletsTranslate = require('@vitalets/google-translate-api');
// const googleTranslateOpenApi = require('google-translate-open-api').default;
// const translateGoogle = require('translate-google');
// const deepl = require('deepl-node');

// const deeplAuthKey = ''; // لو عندك مفتاح Deepl مجاني ضيفه هنا
// const deeplTranslator = deeplAuthKey ? new deepl.Translator(deeplAuthKey) : null;

// const smartTranslate = async (text, to = {to:'en'}) => {
//   // 1. @vitalets/google-translate-api
//   try {
//     const res1 = await vitaletsTranslate(text, { to: to.to });
//     return res1.text;
//   } catch (err) {
//     console.warn('@vitalets/google-translate-api failed');
//   }

//   // 2. google-translate-open-api
//   try {
//     const res2 = await googleTranslateOpenApi(text, { tld: 'com', to: to.to });
//     const [{ data }] = res2;
//     return data[0];
//   } catch (err) {
//     console.warn('google-translate-open-api failed');
//   }

//   // 3. translate-google
//   try {
//     const res3 = await translateGoogle(text, { to: to.to });
//     return res3;
//   } catch (err) {
//     console.warn('translate-google failed');
//   }

//   // 4. deepl-node
//   if (deeplTranslator) {
//     try {
//       const result = await deeplTranslator.translateText(text, null, to.to.toUpperCase());
//       return result.text;
//     } catch (err) {
//       console.warn('deepl-node failed');
//     }
//   }

//   // fallback
//   console.warn('All translation services failed. Returning original text.');
//   return text;
// };

// module.exports = smartTranslate;


