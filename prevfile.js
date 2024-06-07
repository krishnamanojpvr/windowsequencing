import React, { useState, useRef, useEffect } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { isMobile, isTablet } from "react-device-detect";
import Confetti from "react-confetti";
import update from "immutability-helper";
import data from "./data.json";
import { Popover } from "bootstrap";
import CorrectAudio from "../Audio/Correct.mp3";
import OopsTryAgainAudio from "../Audio/OopsTryAgain.mp3";
import PleaseAddTheImagesAudio from "../Audio/PleaseAddTheImages.mp3";
import HowToPlayAudio from "../Audio/HowToPlay.mp3";
import MatchThePatternAudio from "../Audio/MatchThePattern.mp3";

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
      className={`img-thumbnail  dragImg`}
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
      className={`img-thumbnail m-1 ${
        isDragging ? "opacity-50" : ""
      } answerImg`}
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

const DroppableBox = ({
  answerImages,
  setAnswerImages,
  maxItems,
  borderClass,
}) => {
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
      className={`answerbox p-3 d-flex flex-row flex-wrap align-items-center justify-content-center ${borderClass}`}
      style={{ minHeight: "180px", width: "100%" }}
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
  const [tries, setTries] = useState(0);
  const [borderClass, setBorderClass] = useState("");
  const [warning, setWarning] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const handleAudioClick = (audioFile) => {
    const audio = new Audio(audioFile);
    audio.play();
  };

  const questionData = data[currentPage];
  const gameInstructions =
    "Drag and Drop the images from the options into the answer box in the same order as given in the question (You can also reorder the images in the answer box)";
  useEffect(() => {
    const popoverTriggerList = document.querySelectorAll(
      '[data-bs-toggle="popover"]'
    );
    // eslint-disable-next-line
    const popoverList = [...popoverTriggerList].map(
      (popoverTriggerEl) => new Popover(popoverTriggerEl)
    );
  }, []);

  if (!questionData) {
    return <div>Loading...</div>;
  }

  const handleSubmit = () => {
    setSubmitted(true);
    const isCorrect =
      JSON.stringify(answerImages) === JSON.stringify(questionData.question);
    if (isCorrect) {
      setTries(tries + 1);
      setWarning("Correctt!!");
      const CorrectAud = new Audio(CorrectAudio);
      CorrectAud.play();
      setShowConfetti(true);
      setBorderClass("blink-green");
      setTimeout(() => {
        setShowConfetti(false);
        setBorderClass("");
        setSubmitted(false);
        const nextPage = currentPage + 1;
        if (data[nextPage]) {
          setCurrentPage(nextPage);
          setAnswerImages([]);
        } 
        else {
          setTimeout(() => {
            setGameOver(true);
          }, 2500);
        }
      }, 4000);
    } else {
      setBorderClass("blink-red");
      //! console.log(JSON.stringify(answerImages).length)
      if (JSON.stringify(answerImages).length < 3) {
        const PleaseAddTheImagesAud = new Audio(PleaseAddTheImagesAudio);
        PleaseAddTheImagesAud.play();
        setWarning(`Please add the images. .`);
      } else if (!isCorrect) {
        setTries(tries + 1);
        const OopsTryAgainAud = new Audio(OopsTryAgainAudio);
        OopsTryAgainAud.play();
        setWarning("Oops! Try Again :)");
      }
      setTimeout(() => {
        setBorderClass("");
        
      }, 2500);
      setAnswerImages([]);
    }
  };

  return (
    
    <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
     
      <div className="header mt-2">
        <h1>
          Match The Pattern
          <img
            src={"../play.svg"}
            alt="Play audio"
            width="24"
            height="24"
            style={{ cursor: "pointer", marginLeft: "10px" }}
            onClick={() => handleAudioClick(MatchThePatternAudio)}
          />
        </h1>
        <div>
          <button
            tabIndex="0"
            className="btn btn-lg btn-warning mt-2 mb-2"
            data-bs-toggle="popover"
            data-bs-trigger="focus"
            data-bs-title="How to Play?"
            data-bs-content={gameInstructions}
          >
            Game Instructions
            <img
              src={"../play.svg"}
              alt="Play audio"
              width="24"
              height="24"
              style={{ cursor: "pointer", marginLeft: "10px" }}
              onClick={() => handleAudioClick(HowToPlayAudio)}
            />
          </button>
        </div>
      </div>
      <div className="container main mt-4">
        <div className="mb-4">
          <h3>Question:</h3>
          <div className="d-flex flex-row flex-wrap justify-content-center mb-3">
            {questionData.question.map((src, index) => (
              <img
                key={index}
                src={src}
                draggable={false}
                className="img-thumbnail m-1 dragImg"
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
            borderClass={borderClass}
          />
        </div>

        <div>
          {!submitted && !gameOver && (
            <button onClick={handleSubmit} className="submitbutton ms-2 mb-4">
              Submit
            </button>
          )}

          {submitted && !gameOver && (
            <p
              className={`warning ${
                warning.includes("Correct")
                  ? "btn btn-success"
                  : "btn btn-danger"
              }`}
            >
              {warning}
            </p>
          )}

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
