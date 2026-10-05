export type LangCode =
  | "en"
  | "hi"
  | "mr"
  | "gu"
  | "ta"
  | "te"
  | "kn"
  | "ml"
  | "bn"
  | "pa"
  | "ur"
  | "or"
  | "as";

export const LANGUAGES: { code: LangCode; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "ur", label: "Urdu", native: "اردو" },
  { code: "or", label: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "as", label: "Assamese", native: "অসমীয়া" },
];

export const AI_MODELS = ["mT5", "IndicBART", "mBART", "BART", "T5"];

export const SAMPLE_SUMMARIES: Record<LangCode, string> = {
  en: "India's national metro expansion programme crossed 1,000 route kilometres this week, making it the third-largest urban rail network in the world. Officials said twelve additional corridors across Maharashtra, Gujarat and Tamil Nadu will open in phases, cutting average commute time by 27 percent and reducing city emissions significantly. Funding combines central grants, state contributions and multilateral loans.",
  hi: "भारत का राष्ट्रीय मेट्रो विस्तार कार्यक्रम इस सप्ताह 1,000 रूट किलोमीटर पार कर गया, जिससे यह दुनिया का तीसरा सबसे बड़ा शहरी रेल नेटवर्क बन गया है। अधिकारियों ने बताया कि महाराष्ट्र, गुजरात और तमिलनाडु में बारह नए कॉरिडोर चरणबद्ध तरीके से खोले जाएंगे, जिससे औसत यात्रा समय 27 प्रतिशत घटेगा और शहरी प्रदूषण में उल्लेखनीय कमी आएगी।",
  mr: "भारताच्या राष्ट्रीय मेट्रो विस्तार कार्यक्रमाने या आठवड्यात 1,000 मार्ग किलोमीटरचा टप्पा ओलांडला असून तो जगातील तिसरा सर्वात मोठा शहरी रेल्वे प्रकल्प ठरला आहे. महाराष्ट्र, गुजरात आणि तमिळनाडूमध्ये बारा नवे कॉरिडॉर टप्प्याटप्प्याने सुरू होतील, ज्यामुळे सरासरी प्रवासाचा वेळ 27 टक्क्यांनी कमी होईल.",
  gu: "ભારતના રાષ્ટ્રીય મેટ્રો વિસ્તરણ કાર્યક્રમે આ સપ્તાહે 1,000 રૂટ કિલોમીટર પાર કર્યા છે, જે તેને વિશ્વનું ત્રીજું સૌથી મોટું શહેરી રેલ નેટવર્ક બનાવે છે. મહારાષ્ટ્ર, ગુજરાત અને તમિલનાડુમાં બાર નવા કોરિડોર તબક્કાવાર શરૂ થશે.",
  ta: "இந்தியாவின் தேசிய மெட்ரோ விரிவாக்கத் திட்டம் இந்த வாரம் 1,000 வழித்தட கிலோமீட்டரைக் கடந்து, உலகின் மூன்றாவது மிகப்பெரிய நகர்ப்புற ரயில் வலையமைப்பாக மாறியுள்ளது. மகாராஷ்டிரா, குஜராத், தமிழ்நாட்டில் பன்னிரண்டு புதிய வழித்தடங்கள் கட்டம் கட்டமாகத் திறக்கப்படும்.",
  te: "భారత జాతీయ మెట్రో విస్తరణ కార్యక్రమం ఈ వారం 1,000 రూట్ కిలోమీటర్లు దాటి, ప్రపంచంలోనే మూడవ అతిపెద్ద పట్టణ రైలు నెట్‌వర్క్‌గా నిలిచింది. మహారాష్ట్ర, గుజరాత్, తమిళనాడులో పన్నెండు కొత్త కారిడార్లు దశలవారీగా ప్రారంభమవుతాయి.",
  kn: "ಭಾರತದ ರಾಷ್ಟ್ರೀಯ ಮೆಟ್ರೊ ವಿಸ್ತರಣಾ ಯೋಜನೆ ಈ ವಾರ 1,000 ಮಾರ್ಗ ಕಿಲೋಮೀಟರ್ ದಾಟಿದ್ದು, ವಿಶ್ವದ ಮೂರನೇ ಅತಿದೊಡ್ಡ ನಗರ ರೈಲು ಜಾಲವಾಗಿದೆ. ಮಹಾರಾಷ್ಟ್ರ, ಗುಜರಾತ್ ಮತ್ತು ತಮಿಳುನಾಡಿನಲ್ಲಿ ಹನ್ನೆರಡು ಹೊಸ ಕಾರಿಡಾರ್‌ಗಳು ಹಂತಹಂತವಾಗಿ ಆರಂಭವಾಗಲಿವೆ.",
  ml: "ഇന്ത്യയുടെ ദേശീയ മെട്രോ വിപുലീകരണ പദ്ധതി ഈ ആഴ്ച 1,000 റൂട്ട് കിലോമീറ്റർ പിന്നിട്ടു, ലോകത്തിലെ മൂന്നാമത്തെ വലിയ നഗര റെയിൽ ശൃംഖലയായി. മഹാരാഷ്ട്ര, ഗുജറാത്ത്, തമിഴ്‌നാട് എന്നിവിടങ്ങളിൽ പന്ത്രണ്ട് പുതിയ ഇടനാഴികൾ ഘട്ടം ഘട്ടമായി തുറക്കും.",
  bn: "ভারতের জাতীয় মেট্রো সম্প্রসারণ কর্মসূচি এই সপ্তাহে ১,০০০ রুট কিলোমিটার অতিক্রম করেছে, যা এটিকে বিশ্বের তৃতীয় বৃহত্তম নগর রেল নেটওয়ার্কে পরিণত করেছে। মহারাষ্ট্র, গুজরাট ও তামিলনাড়ুতে বারোটি নতুন করিডোর ধাপে ধাপে চালু হবে।",
  pa: "ਭਾਰਤ ਦੇ ਰਾਸ਼ਟਰੀ ਮੈਟਰੋ ਵਿਸਥਾਰ ਪ੍ਰੋਗਰਾਮ ਨੇ ਇਸ ਹਫ਼ਤੇ 1,000 ਰੂਟ ਕਿਲੋਮੀਟਰ ਪਾਰ ਕਰ ਲਏ, ਜਿਸ ਨਾਲ ਇਹ ਦੁਨੀਆ ਦਾ ਤੀਜਾ ਸਭ ਤੋਂ ਵੱਡਾ ਸ਼ਹਿਰੀ ਰੇਲ ਨੈੱਟਵਰਕ ਬਣ ਗਿਆ ਹੈ।",
  ur: "بھارت کے قومی میٹرو توسیعی پروگرام نے اس ہفتے 1,000 روٹ کلومیٹر عبور کر لیے، جس کے بعد یہ دنیا کا تیسرا بڑا شہری ریل نیٹ ورک بن گیا ہے۔ مہاراشٹر، گجرات اور تامل ناڈو میں بارہ نئے کوریڈور مرحلہ وار کھولے جائیں گے۔",
  or: "ଭାରତର ଜାତୀୟ ମେଟ୍ରୋ ବିସ୍ତାର କାର୍ଯ୍ୟକ୍ରମ ଏହି ସପ୍ତାହରେ ୧,୦୦୦ ରୁଟ୍ କିଲୋମିଟର ଅତିକ୍ରମ କରିଛି ଏବଂ ଏହା ବିଶ୍ୱର ତୃତୀୟ ବୃହତ୍ତମ ସହରୀ ରେଳ ନେଟୱାର୍କ ହୋଇଛି।",
  as: "ভাৰতৰ ৰাষ্ট্ৰীয় মেট্ৰো সম্প্ৰসাৰণ আঁচনিয়ে এই সপ্তাহত ১,০০০ ৰুট কিলোমিটাৰ অতিক্ৰম কৰিছে, যাৰ ফলত ই বিশ্বৰ তৃতীয় বৃহত্তম নগৰ ৰেল নেটৱৰ্কলৈ পৰিণত হৈছে।",
};

export const KEYWORDS = [
  "Metro Rail",
  "Infrastructure",
  "Urban Transport",
  "Economy",
  "Policy",
  "Emissions",
  "Maharashtra",
  "Funding",
];

export const ENTITIES = [
  { text: "Ministry of Housing & Urban Affairs", type: "Organisation" },
  { text: "Maharashtra", type: "Location" },
  { text: "Gujarat", type: "Location" },
  { text: "Tamil Nadu", type: "Location" },
  { text: "1,000 km", type: "Quantity" },
  { text: "27 percent", type: "Percentage" },
];

export const HISTORY = [
  { title: "Metro network crosses 1,000 km milestone", lang: "Marathi → English", time: "2 min ago" },
  { title: "RBI holds repo rate steady at 6.25%", lang: "Hindi → English", time: "1 hr ago" },
  { title: "ISRO tests reusable launch vehicle", lang: "English → Tamil", time: "Yesterday" },
  { title: "Monsoon forecast above normal for Konkan", lang: "Marathi → Hindi", time: "2 days ago" },
];
