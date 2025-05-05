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
                    <h1 className="completion-title">Thank you for participating!</h1>
                    <p className="completion-message">
                        Chronic pain results from complex interactions of the body, mind, and emotions, often fueled by the brain’s amplified pain signals and heightened threat perception. We invite you to explore new ways of understanding and managing pain. Feel free to contact us with any questions.
                    </p>
                    <p className="completion-message">
                        Avital Radosher
                        <br/><a href={"mailto:avital.radosher@post.runi.ac.il"} className="completion-message">
                        avital.radosher@post.runi.ac.il
                    </a>
                    </p>

                    <p className="completion-message">
                        You are also welcome to visit our website for further information
                        <br/><a href={"https://sites.google.com/view/project-boggart/home"} className="completion-message">
                            https://sites.google.com/view/project-boggart/home
                        </a>
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