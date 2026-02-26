import React from 'react';
import { useLanguage } from '../LanguageContext';

const CreatureTable = ({ history }) => {
    const { t, language } = useLanguage();
    const isHebrew = language === 'he';
    const currentLocale = isHebrew ? 'he-IL' : 'en-US';

    return (
        <div className={isHebrew ? 'rtl-container' : 'ltr-container'}>
            <table className="diary-table">
                <thead>
                    <tr>
                        <th>{t('day')}</th>
                        <th>{t('date')}</th>
                        <th>{t('my_creature')}</th>
                        <th>{t('weather')}</th>
                        <th>{t('arousal')}</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map((entry, index) => (
                        <tr key={index} className={entry.isMissing ? 'row-missing' : 'row-data'}>
                            <td className="col-day">
                                {new Date(entry.created_at).toLocaleDateString(currentLocale, { weekday: 'long' })}
                            </td>
                            <td className="col-date">
                                {new Date(entry.created_at).toLocaleDateString(currentLocale)}
                            </td>
                            <td className="col-creature">
                                {entry.isMissing ? (
                                    <div className="missing-placeholder">{t('missingEntry')}</div>
                                ) : (
                                    <div className="table-img-wrapper">
                                        <img
                                            src={`${entry.image_url}${entry.image_url.includes('?') ? '&' : '?'}t=${new Date().getTime()}`}
                                            alt="Daily Creature"
                                            className="diary-thumb"
                                        />
                                    </div>
                                )}
                            </td>
                            <td className="col-sam">
                                {!entry.isMissing ? (
                                    <span className="comment-style"> {entry.sam_level}</span>
                                ) : '-'}
                            </td>
                            <td className="col-arousal">
                                {!entry.isMissing ? (
                                    <span className="comment-style"> {entry.arousal_level || 5}</span>
                                ) : '-'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CreatureTable;