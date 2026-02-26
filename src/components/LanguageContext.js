import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

// כל התרגומים של האפליקציה
const translations = {
  he: {
    next: 'הבא',
    previous: 'הקודם',
    visualize: 'יוצר את הכאב',
    download: 'הורדה',

    // Landing Page
    welcomeTitle: 'ברוכים הבאים לפרויקט בוגארט!',
    welcomeDescription: 'הפרויקט מהווה חלק ממחקר אקדמי, ובמהלכו תתבקשו תחילה למלא סדרת שאלונים שיסייעו לנו להעמיק את ההבנה בנושא כאב כרוני. בהמשך, תשתתפו בחוויה אינטראקטיבית ייחודית, שנועדה לחקור את חוויית הכאב הכרוני שלכם ולבחון דרכים חדשניות להתמודדות עמו.',
    letsStart: 'בואו נתחיל',
    login: 'כניסה',

    // Login Page
    loginTitle: 'כניסה',
    loginUsername: 'שם משתמש',
    loginPassword: 'סיסמה',
    loginButton: 'כניסה',
    backToLanding: 'חזרה לעמוד הבית',

    // NavBar
    welcome_message: 'ברוך הבא',
    my_creature: 'היצור שלי',
    weekly_summary: 'סיכום שבועי',
    monthly_summary: 'סיכום חודשי',
    form2_button: 'סימולציה',
    home: 'עמוד הבית',
    logout: 'התנתק',

    // Home Login Page
    save_update: 'שמור עדכון',
    welcomeHome: 'ברוך הבא ',
    samValenceQuestion: 'נא דרג/י כיצד את/ה מרגיש/ה כרגע, כאשר 0 מייצג מצב שלילי מאוד ו־10 מייצג מצב חיובי מאוד.',
    samArousalQuestion: 'נא דרג/י את רמת העוררות שלך, כאשר 0 מייצג רוגע ושלווה ו־10 מייצג עוררות רגשית גבוהה.',
    updateWeatherBtn: 'עדכן',
    processingAI: 'מעדכן...',
    creatingAtmosphere: 'הבינה המלאכותית יוצרת את האווירה החדשה שלך...',
    change_background: 'שנה רקע',
    dailyCheckIn: 'איך הכאב שלך מרגיש היום?',

    // Summary Pages
    downloadPDF: 'הורד PDF',
    monthly_summary: 'סיכום חודשי',
    weekly_summary: 'סיכום שבועי',
    from: 'מ',
    to: 'עד',
    updatingTable: 'מעדכן טבלה...',
    updateTable: 'עדכן טבלה',
    rangeError: 'הטווח חייב להיות בין 1 ל-31 יום',

    // Table Summary
    day: 'יום',
    date: 'תאריך',
    status: 'סטטוס',
    arousal: 'עוררות',
    weather: 'מזג אוויר',
    missingEntry: 'אין תיעוד',

    // Introduction page
    introTitle: 'טופס הסכמה מדעת',
    researchTopic: 'נושא המחקר:',
    researchText: ' ייצוג חזותי של כאב באמצעות בינה מלאכותית.',
    headOfLaboratoryTopic: 'ראש המעבדה:',
    headOfLaboratoryText: ' פרופ’ אמיר עמדי, אוניברסיטת רייכמן, הרצליה.',
    researcherTopic: 'חוקרת:',
    researcherText: ' אביטל רדושר, אוניברסיטת רייכמן, הרצליה.',
    declareTopic: 'אני החתום/ה מטה מצהיר/ה כי:',
    declareText1: 'אני מבין/ה שמטרת המחקר היא לבחון כיצד ייצוגים חזותיים של כאב עשויים לתרום להבנה  ולטיפול בכאב.',
    declareText2: 'השתתפותי במחקר היא מרצוני החופשי, ואני רשאי/ת להפסיק את השתתפותי בכל עת, ללא כל השלכות.',
    declareText3: 'המחקר אינו כרוך בסיכונים ביראותיים',
    declareText4: 'פרטיי האישיים יישמרו בסודיות מוחלטת, יאוחסנו באופן מאובטח למשך 15 שנים ולאחר מכן יימחקו. הנתונים יעודדו (למשל באמצעות מספרים או ראשי תיבות) ולא יפורסמו בשום שלב בצירוף שמי.',
    declareText5: 'הייצוג החזותי של הכאב שלי עשוי לשמש לצורכי הצגה ופרסום, ופרסומים מחקריים, ללא ציון שמי.',
    declareText6: 'ניתן ליצור קשר עם אביטל רדושר (avital.radosher@post.runi.ac.il) בכל שאלה, או לצורך בקשת גישה, עדכון או מחיקה של הנתונים שלי.',
    declareText7: 'למיטב ידיעתי, איני סובל/ת ממחלה או פגיעה נוירולוגית, ראייתי תקינה, ואני מסוגל/ת לבצע את המשימות הנדרשות במחקר.',
    declareText8: 'אנא מלאו את פרטיכם להלן על מנת להתחיל:',
    introName: 'שם מלא *',
    introPhoneNumber: 'טלפון *',
    introDate: 'תאריך *',
    introAgree: 'אני נותן/ת את הסכמתי להשתתפות במחקר ומאשר/ת כי הבנתי את המידע שנמסר לי.',
    introBegin: 'להתחיל מחקר',

    // Landing page boggart
    boggartWelcomeTitle: 'התבוננות עצמית',
    boggartWelcomeDescription1: 'כעת תונחה/י דרך שאלון התבוננות עצמית, שיאפשר לך מבט פנימי על הכאב המתמשך שלך.',
    boggartWelcomeDescription2: 'אנא קחו כמה דקות לשבת במקום שקט ולהתמקד בכאב שלך לפני שנתחיל.',
    boggartWelcomeDescription3: 'נסה/י לקבוע כיצד את/ה חווה את הכאב שלך, ותאר/י אותו כדי להבין אותו בצורה עמוקה יותר',

    // PersonalQuestionnaire
    personalInfoTitle: 'מידע אישי',
    personalInfoInstructions: 'אנו מזמינים אותך לענות על מספר שאלות לגבי הפרטים האישיים שלך:',
    name: 'שם',
    date: 'תאריך',
    age: 'גיל',
    gender: 'מגדר',
    religion: 'מה הדת שלך?',
    nationality: 'מה הלאום שלך?',
    motherTongue: 'שפת האם שלך',
    socioEconomic: 'המצב הסוציו-אקונומי שלך',
    education: 'מה רמת ההשכלה שלך?',
    painDiagnosis: 'האם קיבלת אבחנה רפואית עבור הכאב שלך?',

    // Gender options
    male: 'זכר',
    female: 'נקבה',
    nonBinary: 'לא בינארי / מגדר שלישי',
    other: 'אחר',
    preferNotToSay: 'מעדיף/ה לא לומר',

    // Religion options
    judaism: 'יהדות',
    islam: 'אסלאם',
    christianity: 'נצרות',
    hinduism: 'הינדואיזם',
    buddhism: 'בודהיזם',
    nonReligious: 'לא דתי / אתאיסט',

    // Socio-economic options
    lowerIncome: 'הכנסה נמוכה',
    lowerMiddleIncome: 'הכנסה נמוכה-בינונית',
    middleIncome: 'הכנסה בינונית',
    upperMiddleIncome: 'הכנסה בינונית-גבוהה',
    upperIncome: 'הכנסה גבוהה',

    // Education options
    noFormalSchooling: 'ללא השכלה פורמלית',
    primaryEducation: 'חינוך יסודי',
    highSchool: 'תעודת בגרות או שווה ערך',
    someCollege: 'לימודים על-תיכוניים / הכשרה מקצועית',
    bachelors: 'תואר ראשון',
    masters: 'תואר שני',
    doctorate: 'תואר שלישי (דוקטורט)',

    // Buttons
    submit: 'שלח',
    submitting: 'שולח...',

    // Error messages
    errorMissingConnection: 'שגיאה: חסר חיבור לטפסים קודמים. אנא התחל מחדש את התהליך.',

    // Loading Page
    wait: 'בעוד רגעים ספורים תפגש/י את הכאב',

    // Meet Your Pain
    meetYourPainTitle: 'פגש/י את הכאב שלך',
    meetYourPainDescription: 'בחר/י אחת מארבע אפשרויות למטה:',
    thatMyPain: "זה הכאב שלי!",
    regenerate: 'יצירה מחדש',
    loading: 'טוען את הדמיית הכאב שלך...',
    continueAnyway: 'תמשיך בכל מקרה',

    // Meet Your Pain Rate
    introMeetYourPainRate: 'התבונן/י לעומק בתמונה שנוצרה של הכאב שלך',
    question0: "בסולם של 1-10, עד כמה אתה מרגיש מחובר לדמות החזותית המתארת ​​את חוויית הכאב שלך?",
    question1: "בסולם של 1-10, האם הדמות החזותית מייצגת היטב את הכאב שלך?",
    question2: "בחרת את ההדמיה הזו של הכאב שלך. אנא תאר את מה שאתה רואה וכיצד היא מייצגת את חוויית הכאב שלך:",

    // Completion Page
    completionTitle: 'תודה על השתתפותך!',
    completionMessage: 'כאב כרוני נובע מאינטראקציות מורכבות של הגוף, הנפש והרגשות, שלעתים קרובות מונעות על ידי אותות כאב מוגברים של המוח ותפיסת איום מוגברת. אנו מזמינים אותך לחקור דרכים חדשות להבין ולנהל כאב. אל תהסס לפנות אלינו בכל שאלה.',
    completionName: 'אביטל רדושר',
    completionMessageEnd: 'את/ה מוזמן/ת גם לבקר באתר האינטרנט שלנו למידע נוסף.',
    return: 'דף הבית',

    // Detailed Questionnaire
    write: 'כתב/י כאן...'

  },
  en: {
    next: 'NEXT',
    previous: 'PREVIOUS',
    visualize: "VISUALIZE PAIN",
    download: 'Download',

    // Landing Page
    welcomeTitle: 'Welcome to the Boggart project!',
    welcomeDescription: 'As part of a research study, you will first complete a series of questionnaires that will contribute to our understanding of chronic pain. Following this, you will experience an interactive session designed to explore and address your chronic pain in a unique and innovative way',
    letsStart: "Let's Start",
    login: 'Login',

    // Login Page
    loginTitle: 'Login',
    loginUsername: 'Username',
    loginPassword: 'Password',
    loginButton: 'Login',
    home: 'Home Page',
    logout: 'Logout',

    // NavBar
    welcome_message: 'Welcome',
    my_creature: 'My creature',
    weekly_summary: 'Weekly summary',
    monthly_summary: 'Monthly summary',
    back_to_start: 'Back to start',
    form2_button: 'Simulation',

    // Home Login Page
    save_update: 'Save Update',
    welcomeHome: 'Welcome ',
    samValenceQuestion: 'Please rate how you are feeling right now, with 0 being very negative and 10 being very positive.',
    samArousalQuestion: 'Please describe your arousal levels with 0 being calm and peaceful and 10 being emotional and aroused.',
    updateWeatherBtn: 'Update',
    processingAI: 'Updating...',
    creatingAtmosphere: 'AI is creating your new atmosphere...',
    change_background: 'Change Background',
    dailyCheckIn: 'How is your pain feeling today?',

    // Summary Pages
    downloadPDF: 'Download PDF',
    monthly_summary: 'Monthly Summary',
    weekly_summary: 'Weekly Summary',
    from: 'From',
    to: 'To',
    updatingTable: 'Updating table...',
    updateTable: 'Update Table',
    rangeError: 'The range must be between 1 and 31 days',

    // Table Summary
    day: 'Day',
    date: 'Date',
    status: 'Status',
    arousal: 'Arousal',
    weather: 'Weather',
    missingEntry: 'No entry',

    // Introduction page
    introTitle: 'Informed Consent Form',
    researchTopic: 'Research Topic:',
    researchText: ' Visual Representation of Pain Using AI.',
    headOfLaboratoryTopic: 'Head of Laboratory:',
    headOfLaboratoryText: ' Prof. Amir Amedi, Reichman University, Herzliya.',
    researcherTopic: 'Researcher:',
    researcherText: ' Avital Radosher Reichman University, Herzliya.',
    declareTopic: 'I, the undersigned, declare that:',
    declareText1: 'I understand the purpose of this study is to explore how visual representations of pain may contribute to pain treatment and understanding.',
    declareText2: 'Participation is voluntary, and I may withdraw at any time without consequences.',
    declareText3: 'The study involves no health risks.',
    declareText4: 'My personal information will remain confidential, stored securely for 15 years, and then deleted. Data will be coded (e.g., numbers or initials) and never published with my name.',
    declareText5: 'My pain representation may be used for research presentations and publications without my name.',
    declareText6: 'I may contact Avital Radosher (avital.radosher@post.runi.ac.il) for questions or to request access, updates, or deletion of my data.',
    declareText7: 'To the best of my knowledge, I do not suffer from neurological disease or injury, my vision is normal, and I can perform the study tasks.',
    declareText8: 'Please provide your details below to begin:',
    introName: 'Full Name *',
    introPhoneNumber: 'Phone Number *',
    introDate: 'Date *',
    introAgree: 'I consent to participate and confirm I understand the information provided.',
    introBegin: 'BEGIN STUDY',

    // Landing page boggart
    boggartWelcomeTitle: 'Self Reflection',
    boggartWelcomeDescription1: 'You will now be guided through a self-reflective questionnaire, allowing an introspective view of your ongoing pain.',
    boggartWelcomeDescription2: 'Please take a couple of minutes to sit in a quiet place and focus on your pain before we begin. Allow yourself the time to reflect deeply on each question and explore your pain to better understand it.',
    boggartWelcomeDescription2: 'Try and determine how you experience your pain, and describe it in order to understand it in a deeper sense.',
    boggartWelcomeDescription3: 'Try and determine how you experience your pain, and describe it in order to understand it in a deeper sense.',
    // PersonalQuestionnaire
    personalInfoTitle: 'Personal info',
    personalInfoInstructions: 'We invite you to answer a few questions about your personal details:',

    // Questions
    name: 'Name',
    date: 'Date',
    age: 'Age',
    gender: 'Gender',
    religion: 'What is your religion?',
    nationality: 'What is your nationality?',
    motherTongue: 'Your mother tongue',
    socioEconomic: 'Your socio-economic status',
    education: 'What is your education?',
    painDiagnosis: 'Is there an existing diagnosis for your pain?',
    // Gender options
    male: 'Male',
    female: 'Female',
    nonBinary: 'Non-binary / Third gender',
    other: 'Other',
    preferNotToSay: 'Prefer not to say',
    // Religion options
    judaism: 'Judaism',
    islam: 'Islam',
    christianity: 'Christianity',
    hinduism: 'Hinduism',
    buddhism: 'Buddhism',
    nonReligious: 'Non-religious / Atheist',
    // Socio-economic options
    lowerIncome: 'Lower income',
    lowerMiddleIncome: 'Lower-middle income',
    middleIncome: 'Middle income',
    upperMiddleIncome: 'Upper-middle income',
    upperIncome: 'Upper income',
    // Education options
    noFormalSchooling: 'No formal schooling',
    primaryEducation: 'Primary education',
    highSchool: 'High school diploma or equivalent',
    someCollege: 'Some college / vocational training',
    bachelors: "Bachelor's degree",
    masters: "Master's degree",
    doctorate: 'Doctoral degree (PhD)',
    // Buttons
    submit: 'SUBMIT',
    submitting: 'SUBMITTING...',
    // Error messages
    errorMissingConnection: 'Error: Missing connection to previous forms. Please restart the process.',

    // Loading Page
    wait: 'In a few moments you will meet your pain',

    // Meet Your Pain
    meetYourPainTitle: 'Meet Your Pain',
    meetYourPainDescription: 'Choose one from four options below:',
    thatMyPain: "That's my pain!",
    regenerate: 'Regenerate',
    loading: 'Loading your pain visualization...',
    continueAnyway: "Continue Anyway",

    // Meet Your Pain Rate
    introMeetYourPainRate: 'Take a deep look at the generated image of your pain',
    question0: "On a scale of 1-10, how connected do you feel to the visual character describing your experience of pain?",
    question1: "On a scale of 1-10, is the visual character a well representation of your pain?",
    question2: "You selected this visualization of your pain. Please describe what you see and how it represents your pain experience:",

    // Completion Page
    completionTitle: 'Thank you for participating!',
    completionMessage: 'Chronic pain results from complex interactions of the body, mind, and emotions, often fueled by the brain’s amplified pain signals and heightened threat perception. We invite you to explore new ways of understanding and managing pain. Feel free to contact us with any questions.',
    completionName: 'Avital Radosher',
    completionMessageEnd: 'You are also welcome to visit our website for further information.',
    return: 'RETURN HOME',

    // Detailed Questionnaire
    write: 'Write in here...'
  }
};

// פונקציית התרגום
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

// משנה כיוון טקסט
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    document.dir = language === 'he' ? 'rtl' : 'ltr';
  }, [language]);

  const buttonLanguage = () => {
    setLanguage(prev => prev === 'he' ? 'en' : 'he');
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, buttonLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
