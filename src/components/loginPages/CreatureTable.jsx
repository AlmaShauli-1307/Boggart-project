import React from 'react';
import { useLanguage } from '../LanguageContext';

const dailyQuestions = [
    { en: "What was the first thing that came to mind when you saw your figure?", he: "מה הדבר הראשון שעלה לך כשראית את הדמות שלך?" },
    { en: "What would you name your figure?", he: "איך היית קורא/ת לדמות שלך?" },
    { en: "When is your figure strongest? When is it quietest?", he: "מתי הדמות שלך הכי חזקה? מתי הכי שקטה?" },
    { en: "What is your figure's secret?", he: "מה הסוד של הדמות שלך?" },
    { en: "What is your figure afraid of?", he: "ממה הדמות שלך מפחדת?" },
    { en: "Why does the figure come to visit you?", he: "למה היא מגיעה לבקר אותך?" },
    { en: "What can your figure NOT control?", he: "מה הדמות שלך לא יכולה לשלוט בו?" },
    { en: "If the figure had met you 10 years ago — what would it have said?", he: "אם הדמות הייתה פוגשת אותך לפני 10 שנים — מה היא הייתה אומרת לך?" },
    { en: "How can you make the figure smaller?", he: "איך אפשר להקטין את הדמות?" },
    { en: "What does your figure know about you that nobody else knows?", he: "מה הדמות שלך יודעת עלייך שאף אחד אחר לא יודע?" },
    { en: "What has changed about your figure since you first met?", he: "מה השתנה בדמות שלך מאז שנפגשתם?" },
    { en: "How will you feel about your figure a year from now?", he: "איך תרגיש/י לגבי הדמות שלך בעוד שנה?" },
    { en: "If your figure could write you a letter — what would it say?", he: "אם הדמות שלך יכלה לכתוב לך מכתב — מה היא הייתה כותבת?" },
    { en: "What would you say to your figure on the day you part ways?", he: "מה היית אומר/ת לדמות שלך ביום שתיפרדו?" },
];

const CreatureTable = ({ history }) => {
    const { t, language } = useLanguage();
    const isHebrew = language === 'he';
    const currentLocale = isHebrew ? 'he-IL' : 'en-US';

    const isProcessing = (val) => !val || val === 'Processing...' || val === '-';

    return (
        <div className="table-page-container">
            <style>{`
                .table-page-container {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    padding: 20px 10px;
                }
                .table-wrapper {
                    width: 100%;
                    background: #fff;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                    overflow-x: auto;
                }
                .diary-table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: auto;
                }
                .diary-table th {
                    background-color: #295a4b;
                    color: white;
                    padding: 10px 6px;
                    font-size: 0.75rem;
                    white-space: normal;
                    word-wrap: break-word;
                    text-align: center;
                    vertical-align: middle;
                }
                .diary-table td {
                    padding: 8px 6px;
                    border-bottom: 1px solid #f0f0f0;
                    vertical-align: middle;
                    text-align: center;
                    font-size: 0.8rem;
                    word-break: break-word;
                    white-space: normal;
                    max-width: 150px;
                }
                .diary-thumb {
                    width: 70px;
                    height: auto;
                    max-height: 100px;
                    border-radius: 8px;
                    object-fit: contain;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    transition: transform 0.3s ease;
                    cursor: pointer;
                }
                .diary-thumb:hover {
                    transform: scale(1.5);
                    z-index: 10;
                    position: relative;
                }
                .col-narrow { width: 5%; min-width: 50px; }
                .col-date { width: 7%; min-width: 70px; }
                .col-creature { width: 8%; min-width: 80px; }
                .col-stat { width: 4%; min-width: 40px; }
                .col-medium { width: 7%; min-width: 70px; }
                .col-wide { width: 14%; min-width: 120px; text-align: ${isHebrew ? 'right' : 'left'} !important; }
                .row-missing td { color: #aaa; background: #fafafa; }
            `}</style>

            <div className="table-wrapper">
                <table className="diary-table">
                    <thead>
                        <tr>
                            <th className="col-narrow">{t('day')}</th>
                            <th className="col-date">{t('date')}</th>
                            <th className="col-creature">{isHebrew ? 'היצור שלי' : 'My Creature'}</th>
                            <th className="col-stat">{t('pain')}</th>
                            <th className="col-stat">{t('emotion')}</th>
                            <th className="col-stat">{t('arousal')}</th>
                            <th className="col-stat">{t('energy')}</th>
                            <th className="col-medium">{isHebrew ? 'תחושה' : 'Feeling'}</th>
                            <th className="col-medium">{isHebrew ? 'פעולה' : 'Action'}</th>
                            <th className="col-medium">{isHebrew ? 'צורך' : 'Need'}</th>
                            <th className="col-medium">{isHebrew ? 'מסר' : 'Message'}</th>
                            <th className="col-wide">{isHebrew ? 'שאלה יומית' : 'Daily Question'}</th>
                            <th className="col-wide">{isHebrew ? 'תשובה יומית' : 'Daily Answer'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((entry, index) => {
                            const qIndex = entry.daily_question_index;
                            const question = (qIndex !== null && qIndex !== undefined)
                                ? dailyQuestions[qIndex % dailyQuestions.length]
                                : null;

                            return (
                                <tr key={index} className={entry.isMissing ? 'row-missing' : 'row-data'}>
                                    <td className="col-narrow">{new Date(entry.created_at).toLocaleDateString(currentLocale, { weekday: 'short' })}</td>
                                    <td className="col-date">{new Date(entry.created_at).toLocaleDateString(currentLocale)}</td>
                                    <td className="col-creature">
                                        {!entry.isMissing && entry.image_url ? (
                                            <img
                                                src={`${entry.image_url}${entry.image_url.includes('?') ? '&' : '?'}t=${new Date().getTime()}`}
                                                alt="Creature"
                                                className="diary-thumb"
                                            />
                                        ) : <span>-</span>}
                                    </td>
                                    <td className="col-stat">{!entry.isMissing ? (entry.pain_level ?? '-') : '-'}</td>
                                    <td className="col-stat">{!entry.isMissing ? (entry.sam_level ?? '-') : '-'}</td>
                                    <td className="col-stat">{!entry.isMissing ? (entry.arousal_level ?? '-') : '-'}</td>
                                    <td className="col-stat">{!entry.isMissing ? (entry.energy_level ?? '-') : '-'}</td>
                                    <td className="col-medium">{!entry.isMissing ? (entry.feeling_level ?? '-') : '-'}</td>
                                    <td className="col-medium">{!entry.isMissing && !isProcessing(entry.avatar_do) ? entry.avatar_do : '-'}</td>
                                    <td className="col-medium">{!entry.isMissing && !isProcessing(entry.avatar_need) ? entry.avatar_need : '-'}</td>
                                    <td className="col-medium">{!entry.isMissing && !isProcessing(entry.avatar_tells) ? entry.avatar_tells : '-'}</td>
                                    <td className="col-wide">
                                        {!entry.isMissing && question ? (isHebrew ? question.he : question.en) : '-'}
                                    </td>
                                    <td className="col-wide">
                                        {!entry.isMissing && !isProcessing(entry.daily_answer) ? entry.daily_answer : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CreatureTable;