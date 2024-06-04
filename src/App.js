import './App.css';
import { BrowserRouter as Router,Routes,Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import QuestionPage from './Components/QuestionPage';
import './Components/QuestionPage.css';
function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<QuestionPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
