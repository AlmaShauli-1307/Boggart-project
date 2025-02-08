import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import Question from './Question';

const ProgressBar = ({ currentPage, totalPages }) => {
  const progress = (currentPage / totalPages) * 100;

  return (
    <div className="progress-container">
      <div className="progress-bar" style={{ width: `${progress}%` }}></div>
    </div>
  );
};

const QuestionnaireApp = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageData, setPageData] = useState({ title: '', instructions: '' });
  const [isSubmitting, setIsSubmitting] = useState(false); // State to manage submission status

  useEffect(() => {
    fetch('/Fixed_Questionnaire.csv')
      .then(response => response.text())
      .then(text => {
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log('CSV Loaded:', results.data);
            setQuestions(results.data);
            updatePageData(results.data, 1);
          }
        });
      })
      .catch(error => console.error('❌ Error loading CSV:', error));
  }, []);

  const updatePageData = (data, page) => {
    const pageInfo = data.find(q => Number(q.Page) === page);
    if (pageInfo) {
      setPageData({
        title: pageInfo['Page Title'] || '',
        instructions: pageInfo.Instructions || ''
      });
    } else {
      setPageData({ title: '', instructions: '' });
    }
    console.log('Page Data:', pageData);
  };

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const getCurrentPageQuestions = () => {
    return questions.filter(q => Number(q.Page) === currentPage);
  };

  const handleNext = () => {
    const maxPage = Math.max(...questions.map(q => Number(q.Page)));
    if (currentPage < maxPage) {
      setCurrentPage(prev => {
        const nextPage = prev + 1;
        updatePageData(questions, nextPage);
        return nextPage;
      });
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => {
        const prevPage = prev - 1;
        updatePageData(questions, prevPage);
        return prevPage;
      });
    }
  };

  // Function to send answers to the backend
  const submitAnswers = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      const data = await response.json();
      console.log('✅ Response from server:', data);
      alert('Answers submitted successfully!');
    } catch (error) {
      console.error('❌ Error submitting answers:', error);
      alert('An error occurred while submitting answers.');
    }
    setIsSubmitting(false);
  };

  const totalPages = Math.max(...questions.map(q => Number(q.Page)));

  return (
    <div className="container">
      {/* Logo Image */}
      <img src="/images/logo.png" alt="Logo" className="top-left-image" />

      <h1>{pageData.title}</h1>
      <p>{pageData.instructions}</p>

      {getCurrentPageQuestions().map((q) => (
        <Question key={q.question_ID} question={q} handleAnswer={handleAnswer} answers={answers} />
      ))}

      {/* Progress Bar */}
      <ProgressBar currentPage={currentPage} totalPages={totalPages} />

      <div className="navigation">
        <button onClick={handlePrevious} disabled={currentPage === 1}>
          Previous
        </button>
        <button onClick={handleNext}>
          Next
        </button>
      </div>

      {/* Submit Button - last page only*/}
      {currentPage === totalPages && (
        <button onClick={submitAnswers} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Answers'}
        </button>
      )}
    </div>
  );
};

export default QuestionnaireApp;
