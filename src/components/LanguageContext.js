import e from 'cors';
import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

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
    samValenceQuestion: 'נא דרג/י כיצד את/ה מרגיש/ה כרגע, כאשר 1 מייצג מצב שלילי מאוד ו־9 מייצג מצב חיובי מאוד.',
    samArousalQuestion: 'נא דרג/י את רמת העוררות שלך, כאשר 1 מייצג רוגע ושלווה ו־9 מייצג עוררות רגשית גבוהה.',
    updateWeatherBtn: 'עדכן',
    processingAI: 'מעדכן...',
    creatingAtmosphere: ' המלאכותית יוצרת את האווירה החדשה שלך.הבינה..',
    myCreature: 'היצור שלי',
    notFound: 'לא נמצא יצור במערכת.',

    // Change Background
    change_background: 'שאלון יומי',
    dailyCheckIn: 'איך הכאב שלך מרגיש היום?',
    painLevelQuestion: "בסולם מ־0 עד 10 (כאשר 0 מייצג חוסר כאב ו־10 מייצג את הכאב החמור ביותר שניתן להעלות על הדעת) – כיצד היית מדרג/ת את עוצמת הכאב שלך ברגע זה?",
    energyLevelQuestion: 'עד כמה הצלחת לתפקד בשגרה היום למרות הכאב? (1=בכלל לא, 10=לגמרי)',
    feeling_after_figure: "איך הרגשת כשראית את הדמות שלך היום? (1=לא נעים לי, 10=שמחתי לראות אותה)",
    avatar_do: "מה היית רוצה לעשות עם הדמות היום?",
    whatAvatarNeed: "מה הדמות צריכה ממך היום?",
    avatar_tells: "מה הדמות מנסה להגיד לך היום?",
    happy1: 'שמח',
    sad: 'עצוב',
    anxious: 'חרד',
    tired: 'עייף',
    calm: 'רגוע',
    yourCreature: "הנה הבוגרט שלך. בואו נגלה מה עובר עליו היום",
    notAtAll: 'בכלל לא',
    fully: 'לגמרי',
    uncomfortable: 'לא נעים לי',
    happy: 'שמחתי לראות אותה',

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
    pain: 'עוצמת כאב',
    emotion: 'מצב רגשי',
    arousal: 'עוררות',
    energy: 'תפקוד',
    ability: 'מסוגלות',
    dialogue: 'דיאלוג',
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
    declareText4: 'פרטיי האישיים יישמרו בסודיות מוחלטת, יאוחסנו באופן מאובטח למשך 15 שנים ולאחר מכן יימחקו. הנתונים יקודדו (למשל באמצעות מספרים או ראשי תיבות) ולא יפורסמו בשום שלב בצירוף שמי.',
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
    sex: 'מין',
    religion: 'מה הדת שלך?',
    nationality: 'מה הלאום שלך?',
    motherTongue: 'שפת האם שלך',
    socioEconomic: 'המצב הסוציו-אקונומי שלך',
    education: 'מה רמת ההשכלה שלך?',
    employment: 'מה סטטוס התעסוקה שלך?',
    relationship: 'מה הסטטוס הזוגי שלך?',
    chronicPain: 'האם את/ה סובל/ת מכאב כרוני (3 חודשים ומעלה)?',
    painDuration: 'משך הכאב שלך ',
    painLocation: 'מה המיקום העיקרי של הכאב שלך?',
    medication: 'האם את/ה נוטל/ת תרופות באופן קבוע?',
    medicationType: 'אם כן, איזה סוג של תרופות אתה נוטל/ת?',
    psychological: 'האם את/ה מקבל/ת טיפול פסיכולוגי כרגע?',
    medicalFollowUp: 'האם את/ה במעקב רפואי עבור הכאב?',
    painDiagnosis: 'האם קיבלת אבחנה רפואית עבור הכאב שלך?',

    // Sex options
    male: 'זכר',
    female: 'נקבה',
    intersex: 'אינטרסקס',
    other: 'אחר',
    preferNotToSay: 'מעדיף/ה לא לומר',

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

    // Questionnaire navigation
    pageOf: 'עמוד {current} מתוך {total}',
    fieldRequired: 'נא להשלים שדה זה',
    scrollHint: 'יש עוד שאלות למטה',
    textFieldHint: "אפשר לכתוב 'ללא' אם אין",

    // Error messages
    errorMissingConnection: 'שגיאה: חסר חיבור לטפסים קודמים. אנא התחל מחדש את התהליך.',
    errorCreateAvatar: 'שגיאה ביצירת הדמות. אנא נסה/י שוב.',

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
    question155: "בסולם של 1-10, עד כמה אתה מרגיש מחובר לדמות החזותית המתארת ​​את חוויית הכאב שלך?",
    question156: "בסולם של 1-10, האם הדמות החזותית מייצגת היטב את הכאב שלך?",
    question157: "בחרת את ההדמיה הזו של הכאב שלך. אנא תאר את מה שאתה רואה וכיצד היא מייצגת את חוויית הכאב שלך:",
    question158: 'כמה הדמות מרגישה לך מאיימת עכשיו?',

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
    backToLanding: 'Back to home page',
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
    samValenceQuestion: 'Please rate how you are feeling right now, with 1 being very negative and 9 being very positive.',
    samArousalQuestion: 'Please describe your arousal levels with 1 being calm and peaceful and 9 being emotional and aroused.',
    updateWeatherBtn: 'Update',
    processingAI: 'Updating...',
    creatingAtmosphere: 'AI is creating your new atmosphere...',
    myCreature: 'My Creature',
    notFound: 'No creature found in the system.',

    // Change Background
    change_background: 'Daily questionnaire',
    dailyCheckIn: 'How is your pain feeling today?',
    painLevelQuestion: "On a scale of 0-10 (where 0 represents no pain and 10 represents the worst pain imaginable) – how would you rate your current pain intensity?",
    energyLevelQuestion: "To what extent did you maintain your daily routine today despite the pain? (0=not at all, 10=fully)",
    feeling_after_figure: "How did you feel when you saw your figure today? (1=uncomfortable, 10=happy to see it)",
    avatar_do: "What would you like to do with the figure today?",
    whatAvatarNeed: "What does the figure need from you today?",
    avatar_tells: "What is the figure trying to tell you today?",
    happy1: 'Happy',
    sad: 'Sad',
    anxious: 'Anxious',
    tired: 'Tired',
    calm: 'Calm',
    yourCreature: "Here's your Boggart. Let's find out what's going on with it today",
    notAtAll: 'Not at all',
    fully: 'Fully',
    uncomfortable: 'uncomfortable',
    happy: 'happy to see it',

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
    pain: 'Pain Intensity',
    emotion: 'Emotional state',
    arousal: 'Arousal',
    energy: 'Function',
    ability: 'Ability',
    dialogue: 'Dialogue',
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
    sex: 'Sex',
    religion: 'What is your religion?',
    nationality: 'What is your nationality?',
    motherTongue: 'Your mother tongue',
    socioEconomic: 'Your socio-economic status',
    education: 'What is your education?',
    employment: 'What is your employment status?',
    relationship: 'What is your relationship status?',
    chronicPain: 'Do you suffer from chronic pain (3 months or more)?',
    painDuration: 'How long has your pain been lasting?',
    painLocation: 'What is the main location of your pain?',
    medication: 'Are you currently taking any medications regularly?',
    medicationType: 'If so, what type of medications are you taking?',
    psychological: 'Are you currently receiving psychological treatment?',
    medicalFollowUp: 'Are you under medical follow-up for your pain?',
    painDiagnosis: 'Is there an existing diagnosis for your pain?',

    // Sex options
    male: 'Male',
    female: 'Female',
    intersex: 'Intersex',
    other: 'Other',
    preferNotToSay: 'Prefer not to say',

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

    // Questionnaire navigation
    pageOf: 'Page {current} of {total}',
    fieldRequired: 'Please complete this field',
    scrollHint: 'More questions below',
    textFieldHint: "You can write 'none' if not applicable",

    // Error messages
    errorMissingConnection: 'Error: Missing connection to previous forms. Please restart the process.',
    errorCreateAvatar: 'Error creating avatar. Please try again.',

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
    question155: "On a scale of 1-10, how connected do you feel to the visual character describing your experience of pain?",
    question156: "On a scale of 1-10, is the visual character a well representation of your pain?",
    question157: "You selected this visualization of your pain. Please describe what you see and how it represents your pain experience:",
    question158: 'How threatening does the figure feel to you now?',

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

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

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
