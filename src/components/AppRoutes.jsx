import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './landingPages/LandingPage';
import QuestionnairePage from './expiramentMesurmentForm/QuestionnairePage';
import CompletionPage from './landingPages/CompletionPage';
import LandingPageBoggart from "./landingPages/LandingPageBoggart";
import DetailedQuestionnaire from "./boggartForm/DetailedQuestionnaire";
import PersonalQuestionnaire from "./expiramentMesurmentForm/PersonalQuestionnaire";
import LoadingPage from "./landingPages/LoadingPage";
import MeetYourPain from "./landingPages/MeetYourPain";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/questionnaire" element={<QuestionnairePage />} />
                <Route path="/landing-boggart" element={<LandingPageBoggart />} />
                <Route path="/questionnaire-boggart" element={<DetailedQuestionnaire />} />
                <Route path="/questionnaire-personal" element={<PersonalQuestionnaire />} />
                <Route path="/loading" element={<LoadingPage />} />
                <Route path="/MeetYourPain" element={<MeetYourPain />} />
                <Route path="/completion" element={<CompletionPage />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;