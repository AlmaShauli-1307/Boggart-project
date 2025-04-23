import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CompletionPage.css';
import logo from '../../images/logo.png'; // Adjust path as needed
import PrimaryButton from '../generalComponents/PrimaryButton';

const CompletionPage = () => {
    const navigate = useNavigate();

    const handleContinue = () => {
        navigate('/');
    };

    return (
        <div className="completion-page">
            <header className="completion-header">
                <img src={logo} alt="Boggart" className="logo-image"/>
            </header>
            <div className="completion-container">
                <main className="completion-content">
                    <h1 className="completion-title">Thank You!</h1>
                    <p className="completion-message">
                        Your responses have been successfully submitted.
                        Thank you for contributing to our research study.
                    </p>
                    <div className="completion-cta">
                        <PrimaryButton
                            text="RETURN HOME"
                            onClick={handleContinue}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CompletionPage;