import React from 'react';
import logo from './logo.svg';
import './App.css';
const { ipcRenderer } = window.require("electron");

const {
  CATCH_ON_RENDER,
  CATCH_ON_MAIN
} = require("./utils/constants")




function App() {
  const handleMessage = (event, data) => {
    console.log(data);
  }

  React.useState(() => {
    ipcRenderer.on(CATCH_ON_RENDER, handleMessage)
    return (false);
  }, [])


  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <button onClick={() => {
          console.log("click ");
          ipcRenderer.send(CATCH_ON_MAIN, "test string")
        }}>SEND</button>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
