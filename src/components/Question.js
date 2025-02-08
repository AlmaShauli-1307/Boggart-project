import React from 'react';
import LikertScale from './LikertScale';
import MultiSelect from './MultiSelect';
import Dropdown from './Dropdown';
import TextInput from './TextInput';
import TextArea from './TextArea';
import NumberInput from './NumberInput';
import DatePicker from './DatePicker';
import ColorPicker from './ColorPicker';
import RadioButton from './RadioButton';

// פונקציה להמיר HTML לקוד תקני
const decodeHtml = (html) => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  let decodedValue = txt.value;

  // תיקון בעיות המרת תו '
  decodedValue = decodedValue.replace(/&#39;/g, "'");
  return decodedValue;
};

const Question = ({ question, handleAnswer, answers }) => {
  // אם אין ID לשאלה או אם השאלה ריקה, נחזיר שגיאה או פשוט לא נציג כלום
  if (!question.question_ID || !question.Question || question.Question.trim() === '') {
    return null;  // במקרה כזה, לא מציגים כלום
  }

  const type = (question.question_type || '').toLowerCase();
  const value = answers[question.question_ID];

  // אם סוג השאלה לא תקני, נחזיר שגיאה
  if (!type) {
    return <div className="question">Invalid question type</div>;
  }

  // תיקון עבור הצגת התו "'"
  const renderQuestionText = () => (
    <h3>{decodeHtml(question.Question)}</h3>
  );

  // פונקציות render לשאלות שונות
  const renderLikertScaleQuestion = () => (
    <div className="question likert-scale">
      {renderQuestionText()}
      <LikertScale
        value={value}
        min={question.scale_min}
        max={question.scale_max}
        leftLabel={question.left_label}
        rightLabel={question.right_label}
        scaleLabels={question.scale_labels ? question.scale_labels.split(',') : []}
        onChange={(val) => handleAnswer(question.question_ID, val)}
      />
    </div>
  );

  const renderMultiSelectQuestion = () => (
    <div className="question">
      {renderQuestionText()}
      <MultiSelect
        value={value}
        options={question.options}
        onChange={(val) => handleAnswer(question.question_ID, val)}
      />
    </div>
  );

  const renderDropdownQuestion = () => (
    <div className="question">
      {renderQuestionText()}
      <Dropdown
        value={value}
        options={question.options}
        onChange={(val) => handleAnswer(question.question_ID, val)}
      />
    </div>
  );

  const renderTextInputQuestion = () => (
    <div className="question">
      {renderQuestionText()}
      <TextInput
        value={value}
        onChange={(val) => handleAnswer(question.question_ID, val)}
      />
    </div>
  );

  const renderTextAreaQuestion = () => (
    <div className="question">
      {renderQuestionText()}
      <TextArea
        value={value}
        onChange={(val) => handleAnswer(question.question_ID, val)}
      />
    </div>
  );

  const renderNumberInputQuestion = () => (
    <div className="question">
      {renderQuestionText()}
      <NumberInput
        value={value}
        onChange={(val) => handleAnswer(question.question_ID, val)}
      />
    </div>
  );

  const renderDatePickerQuestion = () => (
    <div className="question">
      {renderQuestionText()}
      <DatePicker
        value={value}
        onChange={(val) => handleAnswer(question.question_ID, val)}
      />
    </div>
  );

  const renderColorPickerQuestion = () => (
    <div className="question">
      {renderQuestionText()}
      <ColorPicker
        value={value}
        onChange={(val) => handleAnswer(question.question_ID, val)}
      />
    </div>
  );

  const renderRadioButtonQuestion = () => (
    <div className="question">
      {renderQuestionText()}
      <RadioButton
        value={value}
        options={{ title: 'Choose an option', values: question.options }}
        onChange={(val) => handleAnswer(question.question_ID, val)}
      />
    </div>
  );

  // switch על פי סוג השאלה
  switch (true) {
    case type.includes('likert_scale'):
      return renderLikertScaleQuestion();
    case type === 'multi_select':
      return renderMultiSelectQuestion();
    case type === 'dropdown':
      return renderDropdownQuestion();
    case type === 'text_short' || type === 'text_long':
      return renderTextAreaQuestion();
    case type === 'number':
      return renderNumberInputQuestion();
    case type === 'date':
      return renderDatePickerQuestion();
    case type === 'color_select':
      return renderColorPickerQuestion();
    case type === 'multi_choice':
      return renderRadioButtonQuestion();
    default:
      return <div className="question">Invalid question type</div>;
  }
};

export default Question;
