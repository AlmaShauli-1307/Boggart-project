import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HEEBO_BASE64 } from './heebo-font';
import NavBar from '../NavBar';
import CreatureTable from './CreatureTable';
import { useLanguage } from '../LanguageContext';
import './CreatureSummary.css';

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

const isProcessing = (val) => !val || val === 'Processing...' || val === '-';

const MonthlySummary = ({ username, onViewChange }) => {
    const { t, language } = useLanguage();
    const [dbHistory, setDbHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    const [tempEndDate, setTempEndDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [tempStartDate, setTempStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toLocaleDateString('en-CA');
    });

    const [appliedRange, setAppliedRange] = useState({
        start: tempStartDate,
        end: tempEndDate
    });

    const isRangeValid = useMemo(() => {
        const start = new Date(tempStartDate);
        const end = new Date(tempEndDate);
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return diffDays > 0 && diffDays <= 31;
    }, [tempStartDate, tempEndDate]);

    useEffect(() => {
        const fetchHistory = async () => {
            const userData = JSON.parse(sessionStorage.getItem('user'));
            const activeUser = username || userData?.username;
            if (!activeUser) return;
            setLoading(true);
            const API_BASE_URL = process.env.REACT_APP_API_URL;
            try {
                const res = await axios.get(`${API_BASE_URL}/api/creature-summary/${activeUser}`, {
                    params: { startDate: appliedRange.start, endDate: appliedRange.end }
                });
                if (res.data.success) setDbHistory(res.data.history || []);
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [username, appliedRange]);

    const handleUpdate = () => {
        if (isRangeValid) setAppliedRange({ start: tempStartDate, end: tempEndDate });
    };

    const fullHistory = useMemo(() => {
        const days = [];
        const start = new Date(appliedRange.start);
        const end = new Date(appliedRange.end);
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        for (let i = 0; i < diffDays; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const dateKey = d.toLocaleDateString('en-CA');
            const found = dbHistory.find(item =>
                new Date(item.created_at).toLocaleDateString('en-CA') === dateKey
            );
            days.push(found || {
                created_at: d.toISOString(),
                isMissing: true,
                pain_level: '-', sam_level: '-', arousal_level: '-',
                energy_level: '-', feeling_level: '-',
                avatar_do: '-', avatar_need: '-', avatar_tells: '-'
            });
        }
        return days;
    }, [dbHistory, appliedRange]);

    const exportToPDF = async () => {
        const userData = JSON.parse(sessionStorage.getItem('user'));
        const displayUsername = username || userData?.username;
        const isRTL = language === 'he';
        const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });

        doc.addFileToVFS('Heebo.ttf', HEEBO_BASE64);
        doc.addFont('Heebo.ttf', 'Heebo', 'normal');
        doc.setFont('Heebo');

        const fixHebrew = (text) => {
            if (!isRTL || !text) return text;
            const str = String(text);
            if (/^[\d./\s-]+$/.test(str)) return str;
            return str.split('').reverse().join('');
        };

        doc.setFontSize(22);
        doc.setTextColor(41, 90, 75);
        const titleText = isRTL ? fixHebrew("סיכום חודשי") : "Monthly Summary";
        doc.text(titleText, isRTL ? 280 : 14, 15, { align: isRTL ? 'right' : 'left' });

        const historyWithImages = await Promise.all(fullHistory.map(async (entry) => {
            let base64 = null;
            if (entry.image_url) {
                try {
                    const res = await fetch(entry.image_url);
                    const blob = await res.blob();
                    base64 = await new Promise(resolve => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                } catch (e) { console.error("Image loading failed", e); }
            }
            return { ...entry, base64 };
        }));

        let headers = isRTL ? [
            fixHebrew('יום'), fixHebrew('תאריך'), fixHebrew('היצור שלי'),
            fixHebrew('כאב'), fixHebrew('רגש'), fixHebrew('עוררות'), fixHebrew('אנרגיה'),
            fixHebrew('תחושה'), fixHebrew('פעולה'), fixHebrew('צורך'), fixHebrew('מסר'),
            fixHebrew('שאלה יומית'), fixHebrew('תשובה יומית'),
        ] : [
            'Day', 'Date', 'My Creature',
            'Pain', 'Emotion', 'Arousal', 'Energy',
            'Feeling', 'Action', 'Need', 'Message',
            'Daily Question', 'Daily Answer'
        ];

        if (isRTL) headers = headers.reverse();

        autoTable(doc, {
            head: [headers],
            body: historyWithImages.map(entry => {
                const dateObj = new Date(entry.created_at);
                const dayName = dateObj.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { weekday: 'short' });
                const dateStr = dateObj.toLocaleDateString(isRTL ? 'he-IL' : 'en-US');

                const qIndex = entry.daily_question_index;
                const question = (qIndex !== null && qIndex !== undefined)
                    ? dailyQuestions[qIndex % dailyQuestions.length]
                    : null;

                const row = [
                    fixHebrew(dayName), dateStr, "",
                    entry.isMissing ? "-" : `${entry.pain_level ?? '-'}`,
                    entry.isMissing ? "-" : `${entry.sam_level ?? '-'}`,
                    entry.isMissing ? "-" : `${entry.arousal_level ?? '-'}`,
                    entry.isMissing ? "-" : `${entry.energy_level ?? '-'}`,
                    entry.isMissing ? "-" : `${entry.feeling_level ?? '-'}`,
                    entry.isMissing ? "-" : (!isProcessing(entry.avatar_do) ? fixHebrew(entry.avatar_do) : '-'),
                    entry.isMissing ? "-" : (!isProcessing(entry.avatar_need) ? fixHebrew(entry.avatar_need) : '-'),
                    entry.isMissing ? "-" : (!isProcessing(entry.avatar_tells) ? fixHebrew(entry.avatar_tells) : '-'),
                    entry.isMissing ? "-" : (question ? fixHebrew(isRTL ? question.he : question.en) : '-'),
                    entry.isMissing ? "-" : (!isProcessing(entry.daily_answer) ? fixHebrew(entry.daily_answer) : '-'),
                ];
                return isRTL ? row.reverse() : row;
            }),
            startY: 25,
            theme: 'grid',
            rowPageBreak: 'avoid',
            showHead: 'everyPage',
            pageBreak: 'auto',
            styles: {
                font: 'Heebo',
                halign: isRTL ? 'right' : 'left',
                valign: 'middle',
                fontSize: 7,
                minCellHeight: 30,
                overflow: 'linebreak',
                lineColor: [96, 96, 96],
                lineWidth: 0.1,
            },
            headStyles: {
                font: 'Heebo',
                fontStyle: 'normal',
                fillColor: [41, 90, 75],
                textColor: [255, 255, 255],
                halign: isRTL ? 'right' : 'left',
                fontSize: 7,
                cellPadding: 3
            },
            columnStyles: {
                [isRTL ? 10 : 2]: { cellWidth: 28, halign: 'center' },
                [isRTL ? 0 : 12]: { cellWidth: 45 },
                [isRTL ? 1 : 11]: { cellWidth: 45 },
            },
            didDrawCell: (data) => {
                const imgColIndex = isRTL ? 10 : 2;
                if (data.section === 'body' && data.column.index === imgColIndex) {
                    const entry = historyWithImages[data.row.index];
                    if (entry && entry.base64) {
                        const imgSize = 22;
                        const x = data.cell.x + (data.cell.width - imgSize) / 2;
                        const y = data.cell.y + (data.cell.height - imgSize) / 2;
                        doc.addImage(entry.base64, 'PNG', x, y, imgSize, imgSize);
                    }
                }
            }
        });
        doc.save(`Monthly_Summary_${displayUsername}.pdf`);
    };

    return (
        <div className="summary-page-wrapper">
            <NavBar />
            <main className="summary-main-content">
                <div className="summary-actions-top">
                    <button className="pdf-download-btn-transparent" onClick={exportToPDF} disabled={loading}>
                        📄 {t('downloadPDF')}
                    </button>
                </div>
                <h2 className="summary-centered-title">{t('monthly_summary')}</h2>
                <div className="date-selection-container">
                    <div className="date-controls-row">
                        <div className="date-input-group">
                            <label>{t('from')}</label>
                            <input type="date" value={tempStartDate} onChange={(e) => setTempStartDate(e.target.value)} />
                        </div>
                        <div className="date-input-group">
                            <label>{t('to')}</label>
                            <input type="date" value={tempEndDate} onChange={(e) => setTempEndDate(e.target.value)} />
                        </div>
                        <button className="update-table-btn" onClick={handleUpdate} disabled={!isRangeValid || loading}>
                            {loading ? t('updatingTable') : t('updateTable')}
                        </button>
                    </div>
                </div>
                {loading ? (
                    <div className="loading-placeholder"><div className="loading-screen"></div></div>
                ) : (
                    <CreatureTable history={fullHistory} />
                )}
            </main>
        </div>
    );
};

export default MonthlySummary;