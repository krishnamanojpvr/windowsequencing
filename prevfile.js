import React, { useState, useRef } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isMobile } from 'react-device-detect';
import Confetti from 'react-confetti';
import update from 'immutability-helper';
import data from './data.json';

const ItemType = 'IMAGE';

const DraggableImage = ({ src, index }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index, src },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  return (
    <img
      ref={drag}
      src={src}
      className={`img-thumbnail ${isDragging ? 'opacity-50' : ''}`}
      width="100"
      height="100"
      alt={`option-${index}`}
      style={{ margin: '5px' }}
    />
  );
};

const getHoverIndex = (monitor, ref, answerImages) => {
  const hoverBoundingRect = ref.current.getBoundingClientRect();
  const hoverClientX = monitor.getClientOffset().x - hoverBoundingRect.left;
  
  let newIndex = 0;
  let sumWidth = 0;
  
  for (let i = 0; i < answerImages.length; i++) {
    const imgWidth = 100; // width of the image (you may adjust if needed)
    sumWidth += imgWidth + 10; // width + margin
    if (hoverClientX < sumWidth) {
      newIndex = i;
      break;
    } else {
      newIndex = i + 1;
    }
  }
  return newIndex;
};

const DroppableBox = ({ answerImages, setAnswerImages, maxItems }) => {
  const ref = useRef(null);

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item, monitor) => {
      if (!ref.current) {
        return;
      }
      const hoverIndex = getHoverIndex(monitor, ref, answerImages);
      item.hoverIndex = hoverIndex;
    },
    drop: (item) => {
      if (answerImages.length >= maxItems) {
        return;
      }
      const hoverIndex = item.hoverIndex !== undefined ? item.hoverIndex : answerImages.length;
      const newAnswerImages = update(answerImages, {
        $splice: [[hoverIndex, 0, item.src]],
      });
      setAnswerImages(newAnswerImages);
    },
  });

  return (
    <div
      ref={drop}
      className="border answerbox p-3 d-flex flex-row flex-wrap align-items-center justify-content-center"
      style={{ minHeight: '180px', width: '70%' }}
    >
      <div ref={ref} className="d-flex flex-row flex-wrap align-items-center justify-content-center">
        {answerImages.map((src, index) => (
          <img
            key={index}
            src={src}
            className="img-thumbnail m-1"
            width="100"
            height="100"
            alt={`answer-${index}`}
          />
        ))}
      </div>
    </div>
  );
};

const QuestionPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [answerImages, setAnswerImages] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const questionData = data[currentPage];

  console.log('Current Page:', currentPage);
  console.log('Question Data:', questionData);

  if (!questionData) {
    return <div>Loading...</div>;
  }

  const handleSubmit = () => {
    const isCorrect = JSON.stringify(answerImages) === JSON.stringify(questionData.question);
    if (isCorrect) {
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
      const nextPage = currentPage + 1;
      if (data[nextPage]) {
        setCurrentPage(nextPage);
        setAnswerImages([]);
      } else {
        alert('You have completed all questions!');
      }
    } else {
      alert('Wrong. Try again.');
      setAnswerImages([]);
    }
  };

  return (
    <DndProvider backend={isMobile ? TouchBackend : HTML5Backend}>
      <div className="container main mt-4">
        <div className="mb-4">
          <h3>Question:</h3>
          <div className="d-flex flex-row flex-wrap justify-content-center mb-3">
            {questionData.question.map((src, index) => (
              <img key={index} src={src} className="img-thumbnail m-1" width="100" height="100" alt={`question-${index}`} />
            ))}
          </div>
        </div>

        <h3>Answer Box:</h3>
        <div className="mb-4 d-flex justify-content-center">
          <DroppableBox answerImages={answerImages} setAnswerImages={setAnswerImages} maxItems={questionData.question.length} />
        </div>

        <div>
          <h3>Options:</h3>
          <div className="d-flex flex-row flex-wrap justify-content-center">
            {questionData.images.map((src, index) => (
              <DraggableImage key={index} src={src} index={index} />
            ))}
          </div>
        </div>

        <div className="mt-3 d-flex justify-content-center">
          <button onClick={handleSubmit} className="btn btn-primary">
            Submit
          </button>
        </div>

        {showConfetti && <Confetti />}
        <br />
      </div>
    </DndProvider>
  );
};

export default QuestionPage;
