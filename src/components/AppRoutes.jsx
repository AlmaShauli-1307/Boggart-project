import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/questionnaire" element={<QuestionnairePageBefore />} />
                <Route path="/landing-boggart" element={<LandingPageBoggart />} />
                <Route path="/questionnaire-boggart" element={<DetailedQuestionnaire />} />
                <Route path="/questionnaire-personal" element={<PersonalQuestionnaire />} />
                <Route path="/meet-your-pain" element={<MeetYourPain />} />
                <Route path="/meet-your-pain-rate" element={<MeetYourPainRate />} />
                <Route path="/questionnaire-after" element={<QuestionnairePageAfter />} />
                <Route path="/completion" element={<CompletionPage />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;