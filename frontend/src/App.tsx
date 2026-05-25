import VideoRoom from './components/pages/VideoRoom';
import HomePage from './components/pages/HomePage';
import {BrowserRouter, Routes, Route} from 'react-router';

function App(){
  return(
    <BrowserRouter>
      <Routes>
        <Route path = '/' element = {<HomePage/>}/>
        <Route path = '/room' element = {<VideoRoom/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;