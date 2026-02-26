import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './LanguageContext';
import LandingPage from './landingPages/LandingPage';
import QuestionnairePage from './expiramentMesurmentForm/QuestionnairePage';
import CompletionPage from './landingPages/CompletionPage';
import LandingPageBoggart from "./landingPages/LandingPageBoggart";
import DetailedQuestionnaire from "./boggartForm/DetailedQuestionnaire";
import PersonalQuestionnaire from "./expiramentMesurmentForm/PersonalQuestionnaire";
import MeetYourPain from "./landingPages/MeetYourPain";
import MeetYourPainRate from "./boggartForm/MeetYourPainRate";
import QuestionnairePageAfter from "./expiramentMesurmentForm/QuestionnairePageAfter";
import QuestionnairePageBefore from "./expiramentMesurmentForm/QuestionnairePageBefore";
import IntroductionPage from "./landingPages/IntroductionPage";
import LoginPage from "./landingPages/LoginPage";
import HomeLoginPage from "./landingPages/HomePageLogin";
import MyCreature from "./loginPages/MyCreature";
import ChangeBackground from "./loginPages/ChangeBackground";
import MonthlySummary from "./loginPages/MonthlySummary";
import WeeklySummary from "./loginPages/WeeklySummary";

function AppRoutes() {
    return (
        <BrowserRouter>
            <LanguageProvider>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/home-login" element={<HomeLoginPage />} />
                    <Route path="/my-creature" element={<MyCreature />} />
                    <Route path="/change-background" element={<ChangeBackground />} />
                    <Route path="/WeeklySummary" element={<WeeklySummary />} />
                    <Route path="/MonthlySummary" element={<MonthlySummary />} />
                    <Route path="/introduction" element={<IntroductionPage />} />
                    <Route path="/questionnaire-before" element={<QuestionnairePageBefore />} />
                    <Route path="/form1" element={<QuestionnairePage csvName="form1" />} />
                    <Route path="/form2" element={<DetailedQuestionnaire />} />
                    <Route path="/landing-boggart" element={<LandingPageBoggart />} />
                    <Route path="/questionnaire-boggart" element={<DetailedQuestionnaire />} />
                    <Route path="/questionnaire-personal" element={<PersonalQuestionnaire />} />
                    <Route path="/meet-your-pain" element={<MeetYourPain />} />
                    <Route path="/meet-your-pain-rate" element={<MeetYourPainRate />} />
                    <Route path="/questionnaire-after" element={<QuestionnairePageAfter />} />
                    <Route path="/completion" element={<CompletionPage />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </LanguageProvider>
        </BrowserRouter>
    );
}

export default AppRoutes;