import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HEEBO_BASE64 } from './heebo-font';
import NavBar from '../NavBar';
import CreatureTable from './CreatureTable';
import { useLanguage } from '../LanguageContext';
import './CreatureSummary.css';

const MonthlySummary = ({ username, onViewChange }) => {
    const { t, language } = useLanguage();
    const [dbHistory, setDbHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    // הגדרת תאריך סיום להיום ותאריך התחלה לפני 30 יום
    const [tempEndDate, setTempEndDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [tempStartDate, setTempStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30); // 30 יום אחורה לסיכום חודשי
        return d.toLocaleDateString('en-CA');
    });

    // תאריכים סופיים שמשמשים לשליפה מהשרת
    const [appliedRange, setAppliedRange] = useState({
        start: tempStartDate,
        end: tempEndDate
    });

    const user = JSON.parse(sessionStorage.getItem('user'));

    // בדיקה אם הטווח חוקי (בין 1 ל-31 יום)
    const isRangeValid = useMemo(() => {
        const start = new Date(tempStartDate);
        const end = new Date(tempEndDate);
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
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
                if (res.data.success) {
                    setDbHistory(res.data.history || []);
                }
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [username, appliedRange]);

    const handleUpdate = () => {
        if (isRangeValid) {
            setAppliedRange({ start: tempStartDate, end: tempEndDate });
        }
    };

    const fullHistory = useMemo(() => {
        const days = [];
        const start = new Date(appliedRange.start);
        const end = new Date(appliedRange.end);
        let diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        for (let i = 0; i < diffDays; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const dateKey = d.toLocaleDateString('en-CA');

            const found = dbHistory.find(item => {
                const itemDate = new Date(item.created_at).toLocaleDateString('en-CA');
                return itemDate === dateKey;
            });

            days.push(found || {
                created_at: d.toISOString(),
                isMissing: true,
                sam_level: '-',
                arousal_level: '-'
            });
        }
        return days; // שהימים החדשים יהיו למעלה
    }, [dbHistory, appliedRange]);

    const exportToPDF = async () => {
        const userData = JSON.parse(sessionStorage.getItem('user'));
        const displayUsername = username || userData?.username;
        const isRTL = language === 'he';
        const doc = jsPDF({ orientation: 'landscape', format: 'a4' });

        // 1. טעינת פונט Heebo - הבסיס למניעת ג'יבריש
        doc.addFileToVFS('Heebo.ttf', HEEBO_BASE64);
        doc.addFont('Heebo.ttf', 'Heebo', 'normal');
        doc.setFont('Heebo');

        const fixHebrew = (text) => {
            if (!isRTL || !text) return text;
            const str = String(text);
            if (/^[\d./\s-]+$/.test(str)) return str;
            return str.split('').reverse().join('');
        };

        // 2. כותרת המסמך
        doc.setFontSize(22);
        doc.setTextColor(41, 90, 75);
        const titleText = isRTL ? fixHebrew("סיכום חודשי") : "Monthly Summary";
        doc.text(titleText, isRTL ? 280 : 14, 15, { align: isRTL ? 'right' : 'left' });

        // 3. טעינה מוקדמת של כל התמונות (Base64)
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

        // 4. הכנת כותרות הטבלה
        let headers = [
            t('day'),
            t('date'),
            isRTL ? "היצור שלי" : "My Creature",
            t('weather'), // SAM
            t('arousal')
        ].map(h => fixHebrew(h));

        if (isRTL) headers = headers.reverse();

        // 5. יצירת הטבלה
        autoTable(doc, {
            head: [headers],
            body: historyWithImages.map(entry => {
                const dateObj = new Date(entry.created_at);
                const dayName = dateObj.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { weekday: 'long' });
                const dateStr = dateObj.toLocaleDateString(isRTL ? 'he-IL' : 'en-US');
                const sam = entry.isMissing ? (isRTL ? "אין תיעוד" : "No Entry") : `${entry.sam_level}`;
                const arousal = entry.isMissing ? "-" : `${entry.arousal_level}`;

                const row = [fixHebrew(dayName), dateStr, "", fixHebrew(sam), arousal];
                return isRTL ? row.reverse() : row;
            }),
            startY: 25,
            theme: 'grid',
            rowPageBreak: 'avoid',

            // 1. הגדרות סטייל כלליות
            styles: {
                font: 'Heebo',
                fontStyle: 'normal', // מכריח שימוש בסטייל הרגיל שטענו
                halign: isRTL ? 'right' : 'left',
                valign: 'middle',
                fontSize: 10
            },

            // 2. הגדרות כותרת (כאן נפתר הג'יבריש)
            headStyles: {
                font: 'Heebo',
                fontStyle: 'normal', // התיקון הקריטי: מונע ניסיון להשתמש ב-Bold שלא קיים
                fillColor: [41, 90, 75],
                textColor: [255, 255, 255],
                halign: isRTL ? 'right' : 'left'
            },

            // 3. הגדרות גוף הטבלה
            bodyStyles: {
                font: 'Heebo',
                fontStyle: 'normal'
            },

            columnStyles: {
                [isRTL ? 2 : 2]: { cellWidth: 35, minCellHeight: 35 }
            },

            didDrawCell: (data) => {
                const imgColIndex = isRTL ? 2 : 2;
                if (data.section === 'body' && data.column.index === imgColIndex) {
                    const entry = historyWithImages[data.row.index];
                    if (entry && entry.base64) {
                        doc.addImage(entry.base64, 'PNG', data.cell.x + 7, data.cell.y + 7, 20, 20);
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
                            <input
                                type="date"
                                value={tempStartDate}
                                onChange={(e) => setTempStartDate(e.target.value)}
                            />
                        </div>

                        <div className="date-input-group">
                            <label>{t('to')}</label>
                            <input
                                type="date"
                                value={tempEndDate}
                                onChange={(e) => setTempEndDate(e.target.value)}
                            />
                        </div>

                        <button
                            className="update-table-btn"
                            onClick={handleUpdate}
                            disabled={!isRangeValid || loading}
                        >
                            {loading ? t('updatingTable') : t('updateTable')}
                        </button>
                    </div>

                    {!isRangeValid && (
                        <div className="range-error-row">
                            <p className="range-error-text">{t('rangeError')}</p>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="loading-placeholder">
                        <div className="loading-screen"></div>
                    </div>
                ) : (
                    <CreatureTable history={fullHistory} />
                )}
            </main>
        </div>
    );
};

export default MonthlySummary;