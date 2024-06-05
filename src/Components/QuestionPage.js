import React, { useState, useRef, useEffect } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { isMobile } from "react-device-detect";
import Confetti from "react-confetti";
import update from "immutability-helper";
import data from "./data.json";
import { Popover } from "bootstrap";

const ItemType = "IMAGE";
const AnswerType = "ANSWER_IMAGE";

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
      className={`img-thumbnail ${isDragging ? "opacity-50" : ""}`}
      width="100"
      height="100"
      alt={`option-${index}`}
      style={{ margin: "5px" }}
    />
  );
};

const DraggableAnswerImage = ({ src, index, moveImage }) => {
  const ref = useRef(null);

  const [, drop] = useDrop({
    accept: AnswerType,
    hover: (item) => {
      if (item.index !== index) {
        moveImage(item.index, index);
        item.index = index;
      }
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: AnswerType,
    item: { index },

    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <img
      ref={ref}
      src={src}
      className={`img-thumbnail m-1 ${isDragging ? "opacity-50" : ""}`}
      width="100"
      height="100"
      alt={`answer-${index}`}
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
      const hoverIndex =
        item.hoverIndex !== undefined ? item.hoverIndex : answerImages.length;
      const newAnswerImages = update(answerImages, {
        $splice: [[hoverIndex, 0, item.src]],
      });
      setAnswerImages(newAnswerImages);
    },
  });

  const moveImage = (fromIndex, toIndex) => {
    const draggedImage = answerImages[fromIndex];
    const newAnswerImages = update(answerImages, {
      $splice: [
        [fromIndex, 1],
        [toIndex, 0, draggedImage],
      ],
    });
    setAnswerImages(newAnswerImages);
  };

  return (
    <div
      ref={drop}
      className="border answerbox p-3 d-flex flex-row flex-wrap align-items-center justify-content-center"
      style={{ minHeight: "180px", width: "70%" }}
    >
      <div
        ref={ref}
        className="d-flex flex-row flex-wrap align-items-center justify-content-center"
      >
        {answerImages.map((src, index) => (
          <DraggableAnswerImage
            key={index}
            src={src}
            index={index}
            moveImage={moveImage} 
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
  const [tries, setTries] = useState(1);
  const gameInstructions = "";
  const questionData = data[currentPage];
  useEffect(() => {
    const popoverTriggerList = document.querySelectorAll(
      '[data-bs-toggle="popover"]'
    );
    const popoverList = [...popoverTriggerList].map(
      (popoverTriggerEl) => new Popover(popoverTriggerEl)
    );
  }, []);

  // console.log('Current Page:', currentPage);
  // console.log('Question Data:', questionData);

  if (!questionData) {
    return <div>Loading...</div>;
  }

  const handleSubmit = () => {
    const isCorrect =
      JSON.stringify(answerImages) === JSON.stringify(questionData.question);
    setTries(tries + 1);
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
        alert("You have completed all questions!");
      }
    } else {
      alert("Wrong. Try again.");
      setAnswerImages([]);
    }
  };

  return (
    <DndProvider backend={isMobile ? TouchBackend : HTML5Backend}>
      <div className="container main mt-4">
        <button
          tabIndex="0"
          className="btn btn-lg btn-warning mt-2 mb-2"
          data-bs-toggle="popover"
          data-bs-trigger="focus"
          data-bs-title="How to Play?"
          data-bs-content={gameInstructions}
        >
          Game Instructions
        </button>
        <div className="mb-4">
          <h3>Question:</h3>
          <div className="d-flex flex-row flex-wrap justify-content-center mb-3">
            {questionData.question.map((src, index) => (
              <img
                key={index}
                src={src}
                className="img-thumbnail m-1"
                width="100"
                height="100"
                alt={`question-${index}`}
              />
            ))}
          </div>
        </div>

        <h3>Answer Box:</h3>
        <div className="mb-4 d-flex justify-content-center align-items-center">
          <DroppableBox
            answerImages={answerImages}
            setAnswerImages={setAnswerImages}
            maxItems={questionData.question.length}
          />
          <button onClick={handleSubmit} id="submitbutton" className="btn btn-custom ms-2 rounded-5 h-25 ">
            Submit
          </button>
        </div>
        

        <div>
          <h3>Options:</h3>
          <div className="d-flex flex-row flex-wrap justify-content-center">
            {questionData.images.map((src, index) => (
              <DraggableImage key={index} src={src} index={index} />
            ))}
          </div>
        </div>

        {showConfetti && <Confetti />}
        <br />
      </div>
    </DndProvider>
  );
};

export default QuestionPage;
